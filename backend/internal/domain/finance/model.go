package finance

import "time"

const (
    StatusDraft     = "DRAFT"
    StatusSubmitted = "SUBMITTED"
    StatusReviewed  = "REVIEWED"
    StatusApproved  = "APPROVED"
    StatusRejected  = "REJECTED"
    StatusSigned    = "SIGNED"
)

// FinanceActivity represents a payment/voucher workflow entry.
type FinanceActivity struct {
    ID           uint64                `gorm:"primaryKey" json:"id"`
    VoucherNo    string                `gorm:"uniqueIndex;size:64" json:"voucher_no"`
    Status       string                `gorm:"type:enum('DRAFT','SUBMITTED','REVIEWED','APPROVED','REJECTED','SIGNED');default:'DRAFT'" json:"status"`
    MakerID      uint64                `json:"maker_id"`
    CheckerID    *uint64               `json:"checker_id"`
    SignerID     *uint64               `json:"signer_id"`
    PayTo        string                `gorm:"size:160" json:"pay_to"`
    TotalAmount  float64               `json:"total_amount"`
    AmountInWords string               `gorm:"size:255" json:"amount_in_words"`
    BankName     string                `gorm:"size:120" json:"bank_name"`
    BankAccount  string                `gorm:"size:120" json:"bank_account"`
    Note         string                `json:"note"`
    QRFile       *string               `gorm:"size:255" json:"qr_file"`
    SubmittedAt  *time.Time            `json:"submitted_at"`
    ReviewedAt   *time.Time            `json:"reviewed_at"`
    ApprovedAt   *time.Time            `json:"approved_at"`
    RejectedAt   *time.Time            `json:"rejected_at"`
    SignedAt     *time.Time            `json:"signed_at"`
    Items        []FinanceActivityItem `gorm:"foreignKey:ActivityID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"items"`
    CreatedAt    time.Time             `json:"created_at"`
    UpdatedAt    time.Time             `json:"updated_at"`
}

// FinanceActivityItem represents a line item for the activity.
type FinanceActivityItem struct {
    ID          uint64    `gorm:"primaryKey" json:"id"`
    ActivityID  uint64    `gorm:"index;not null" json:"activity_id"`
    AccNo       string    `gorm:"size:32" json:"acc_no"`
    AccountName string    `gorm:"size:160" json:"account_name"`
    Description string    `gorm:"size:255" json:"description"`
    Amount      float64   `json:"amount"`
    CreatedAt   time.Time `json:"created_at"`
}

// FinanceActivityLog captures transitions.
type FinanceActivityLog struct {
    ID         uint64    `gorm:"primaryKey" json:"id"`
    ActivityID uint64    `gorm:"index" json:"activity_id"`
    ActorID    uint64    `json:"actor_id"`
    Action     string    `gorm:"size:32" json:"action"`
    FromStatus string    `gorm:"size:32" json:"from_status"`
    ToStatus   string    `gorm:"size:32" json:"to_status"`
    Note       string    `json:"note"`
    CreatedAt  time.Time `json:"created_at"`
}
