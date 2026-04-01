package finance

import (
    "context"
    "errors"
    "fmt"
    "io"
    "mime/multipart"
    "os"
    "path/filepath"
    "time"

    "gorm.io/gorm"
)

var (
    ErrForbidden    = errors.New("forbidden")
    ErrInvalidState = errors.New("invalid status")
    ErrDuplicateVoucher = errors.New("voucher number already exists")
)

type Service struct {
    db        *gorm.DB
    uploadDir string
}

type CreateRequest struct {
    VoucherNo    string                `json:"voucher_no"`
    PayTo        string                `json:"pay_to" binding:"required"`
    TotalAmount  float64               `json:"total_amount" binding:"required"`
    AmountInWords string               `json:"amount_in_words"`
    BankName     string                `json:"bank_name"`
    BankAccount  string                `json:"bank_account"`
    Note         string                `json:"note"`
    Items        []CreateItemRequest   `json:"items" binding:"required,dive"`
}

type CreateItemRequest struct {
    AccNo       string  `json:"acc_no" binding:"required"`
    AccountName string  `json:"account_name" binding:"required"`
    Description string  `json:"description"`
    Amount      float64 `json:"amount" binding:"required"`
}

type ReviewRequest struct {
    Action string `json:"action" binding:"required,oneof=APPROVE REJECT"`
    Note   string `json:"note"`
}

func NewService(db *gorm.DB, uploadDir string) *Service {
    if uploadDir == "" {
        uploadDir = "./uploads"
    }
    return &Service{db: db, uploadDir: uploadDir}
}

func (s *Service) Create(ctx context.Context, makerID uint64, req CreateRequest) (*FinanceActivity, error) {
    if len(req.Items) == 0 {
        return nil, fmt.Errorf("items required")
    }
    if req.VoucherNo == "" {
        req.VoucherNo = fmt.Sprintf("VCH-%d", time.Now().UnixNano())
    } else {
        var exists int64
        if err := s.db.WithContext(ctx).Model(&FinanceActivity{}).Where("voucher_no = ?", req.VoucherNo).Count(&exists).Error; err != nil {
            return nil, err
        }
        if exists > 0 {
            return nil, ErrDuplicateVoucher
        }
    }
    activity := &FinanceActivity{
        VoucherNo:    req.VoucherNo,
        Status:       StatusDraft,
        MakerID:      makerID,
        PayTo:        req.PayTo,
        TotalAmount:  req.TotalAmount,
        AmountInWords: req.AmountInWords,
        BankName:     req.BankName,
        BankAccount:  req.BankAccount,
        Note:         req.Note,
    }
    for _, item := range req.Items {
        activity.Items = append(activity.Items, FinanceActivityItem{
            AccNo:       item.AccNo,
            AccountName: item.AccountName,
            Description: item.Description,
            Amount:      item.Amount,
        })
    }
    if err := s.db.WithContext(ctx).Create(activity).Error; err != nil {
        return nil, err
    }
    if err := s.log(ctx, activity.ID, makerID, "CREATE", "", StatusDraft, ""); err != nil {
        return nil, err
    }
    return activity, nil
}

func (s *Service) List(ctx context.Context, role string, userID uint64, status string) ([]FinanceActivity, error) {
    var activities []FinanceActivity
    q := s.db.WithContext(ctx).Model(&FinanceActivity{}).Preload("Items").Order("updated_at DESC")
    if status != "" {
        q = q.Where("status = ?", status)
    }
    switch role {
    case "FINANCE_MAKER":
        q = q.Where("maker_id = ?", userID)
    case "FINANCE_CHECKER", "FINANCE_SIGNER":
        // can see all; optionally filter by status
    default:
        return nil, ErrForbidden
    }
    if err := q.Find(&activities).Error; err != nil {
        return nil, err
    }
    return activities, nil
}

func (s *Service) Detail(ctx context.Context, id uint64) (*FinanceActivity, error) {
    var activity FinanceActivity
    if err := s.db.WithContext(ctx).Preload("Items").First(&activity, id).Error; err != nil {
        return nil, err
    }
    return &activity, nil
}

func (s *Service) Submit(ctx context.Context, id, makerID uint64) (*FinanceActivity, error) {
    var activity FinanceActivity
    if err := s.db.WithContext(ctx).First(&activity, id).Error; err != nil {
        return nil, err
    }
    if activity.MakerID != makerID {
        return nil, ErrForbidden
    }
    if activity.Status != StatusDraft && activity.Status != StatusRejected {
        return nil, ErrInvalidState
    }
    now := time.Now()
    updates := map[string]interface{}{
        "status":      StatusSubmitted,
        "submitted_at": &now,
    }
    if err := s.db.WithContext(ctx).Model(&activity).Updates(updates).Error; err != nil {
        return nil, err
    }
    if err := s.log(ctx, id, makerID, "SUBMIT", activity.Status, StatusSubmitted, ""); err != nil {
        return nil, err
    }
    activity.Status = StatusSubmitted
    activity.SubmittedAt = &now
    return &activity, nil
}

func (s *Service) Review(ctx context.Context, id, checkerID uint64, req ReviewRequest) (*FinanceActivity, error) {
    var activity FinanceActivity
    if err := s.db.WithContext(ctx).First(&activity, id).Error; err != nil {
        return nil, err
    }
    if activity.Status != StatusSubmitted {
        return nil, ErrInvalidState
    }
    now := time.Now()
    toStatus := StatusApproved
    action := "APPROVE"
    updates := map[string]interface{}{
        "checker_id": checkerID,
        "reviewed_at": &now,
    }
    if req.Action == "REJECT" {
        toStatus = StatusRejected
        action = "REJECT"
        updates["rejected_at"] = &now
    } else {
        updates["approved_at"] = &now
    }
    updates["status"] = toStatus

    if err := s.db.WithContext(ctx).Model(&activity).Updates(updates).Error; err != nil {
        return nil, err
    }
    if err := s.log(ctx, id, checkerID, action, activity.Status, toStatus, req.Note); err != nil {
        return nil, err
    }
    activity.Status = toStatus
    activity.CheckerID = &checkerID
    activity.ReviewedAt = &now
    if req.Action == "REJECT" {
        activity.RejectedAt = &now
    } else {
        activity.ApprovedAt = &now
    }
    return &activity, nil
}

func (s *Service) Sign(ctx context.Context, id, signerID uint64, file *multipart.FileHeader) (*FinanceActivity, error) {
    var activity FinanceActivity
    if err := s.db.WithContext(ctx).First(&activity, id).Error; err != nil {
        return nil, err
    }
    storedPath, err := s.saveQR(id, file)
    if err != nil {
        return nil, err
    }
    now := time.Now()
    updates := map[string]interface{}{
        "status":    StatusSigned,
        "signer_id": signerID,
        "signed_at": &now,
        "qr_file":   storedPath,
    }
    if err := s.db.WithContext(ctx).Model(&activity).Updates(updates).Error; err != nil {
        return nil, err
    }
    if err := s.log(ctx, id, signerID, "SIGN", activity.Status, StatusSigned, ""); err != nil {
        return nil, err
    }
    activity.Status = StatusSigned
    activity.SignerID = &signerID
    activity.SignedAt = &now
    activity.QRFile = &storedPath
    return &activity, nil
}

func (s *Service) saveQR(activityID uint64, file *multipart.FileHeader) (string, error) {
    dir := filepath.Join(s.uploadDir, "finance", fmt.Sprintf("%d", activityID))
    if err := os.MkdirAll(dir, 0o755); err != nil {
        return "", err
    }
    filename := fmt.Sprintf("qr-%d-%d%s", activityID, time.Now().UnixNano(), filepath.Ext(file.Filename))
    target := filepath.Join(dir, filename)
    if err := saveMultipartFile(file, target); err != nil {
        return "", err
    }
    return filepath.ToSlash(filepath.Join("/uploads", "finance", fmt.Sprintf("%d", activityID), filename)), nil
}

func saveMultipartFile(file *multipart.FileHeader, dst string) error {
    src, err := file.Open()
    if err != nil {
        return err
    }
    defer src.Close()

    out, err := os.Create(dst)
    if err != nil {
        return err
    }
    defer out.Close()

    if _, err := io.Copy(out, src); err != nil {
        return err
    }
    return nil
}

func (s *Service) log(ctx context.Context, activityID, actorID uint64, action, fromStatus, toStatus, note string) error {
    entry := &FinanceActivityLog{
        ActivityID: activityID,
        ActorID:    actorID,
        Action:     action,
        FromStatus: fromStatus,
        ToStatus:   toStatus,
        Note:       note,
    }
    return s.db.WithContext(ctx).Create(entry).Error
}
