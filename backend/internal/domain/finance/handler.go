package finance

import (
    "errors"

    "github.com/gin-gonic/gin"

    "github.com/company/internal-service-report/pkg/response"
)

// Handler exposes finance endpoints.
type Handler struct {
    svc *Service
}

func NewHandler(svc *Service) *Handler {
    return &Handler{svc: svc}
}

// Create (maker)
func (h *Handler) Create(c *gin.Context) {
    userID := c.GetUint64("userID")
    var req CreateRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err)
        return
    }
    activity, err := h.svc.Create(c.Request.Context(), userID, req)
    if err != nil {
        if errors.Is(err, ErrDuplicateVoucher) {
            response.BadRequest(c, err)
            return
        }
        response.InternalError(c, err)
        return
    }
    response.Created(c, activity)
}

// List (all finance roles, maker sees own)
func (h *Handler) List(c *gin.Context) {
    userID := c.GetUint64("userID")
    roleVal, _ := c.Get("role")
    role, _ := roleVal.(string)
    status := c.Query("status")
    activities, err := h.svc.List(c.Request.Context(), role, userID, status)
    if err != nil {
        response.InternalError(c, err)
        return
    }
    response.OK(c, activities)
}

// Detail
func (h *Handler) Detail(c *gin.Context) {
    var uri struct {
        ID uint64 `uri:"id" binding:"required"`
    }
    if err := c.ShouldBindUri(&uri); err != nil {
        response.BadRequest(c, err)
        return
    }
    activity, err := h.svc.Detail(c.Request.Context(), uri.ID)
    if err != nil {
        response.InternalError(c, err)
        return
    }
    response.OK(c, activity)
}

// Submit (maker)
func (h *Handler) Submit(c *gin.Context) {
    userID := c.GetUint64("userID")
    var uri struct {
        ID uint64 `uri:"id" binding:"required"`
    }
    if err := c.ShouldBindUri(&uri); err != nil {
        response.BadRequest(c, err)
        return
    }
    activity, err := h.svc.Submit(c.Request.Context(), uri.ID, userID)
    if err != nil {
        response.BadRequest(c, err)
        return
    }
    response.OK(c, activity)
}

// Review (checker)
func (h *Handler) Review(c *gin.Context) {
    userID := c.GetUint64("userID")
    var uri struct {
        ID uint64 `uri:"id" binding:"required"`
    }
    if err := c.ShouldBindUri(&uri); err != nil {
        response.BadRequest(c, err)
        return
    }
    var req ReviewRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err)
        return
    }
    activity, err := h.svc.Review(c.Request.Context(), uri.ID, userID, req)
    if err != nil {
        if errors.Is(err, ErrForbidden) {
            response.Forbidden(c)
            return
        }
        response.BadRequest(c, err)
        return
    }
    response.OK(c, activity)
}

// Sign (signer)
func (h *Handler) Sign(c *gin.Context) {
    userID := c.GetUint64("userID")
    var uri struct {
        ID uint64 `uri:"id" binding:"required"`
    }
    if err := c.ShouldBindUri(&uri); err != nil {
        response.BadRequest(c, err)
        return
    }
    file, err := c.FormFile("qr_file")
    if err != nil {
        response.BadRequest(c, err)
        return
    }
    activity, err := h.svc.Sign(c.Request.Context(), uri.ID, userID, file)
    if err != nil {
        response.BadRequest(c, err)
        return
    }
    response.OK(c, activity)
}
