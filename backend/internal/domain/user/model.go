package user

import "time"

const (
    RoleMasterAdminID = 1
    RoleAdminID       = 2
    RoleTeknisiID     = 3
    RoleFinanceMakerID   = 4
    RoleFinanceCheckerID = 5
    RoleFinanceSignerID  = 6

    RoleMasterAdmin    = "MASTER_ADMIN"
    RoleAdmin          = "ADMIN"
    RoleTeknisi        = "TEKNISI"
    RoleFinanceMaker   = "FINANCE_MAKER"
    RoleFinanceChecker = "FINANCE_CHECKER"
    RoleFinanceSigner  = "FINANCE_SIGNER"
)

// Role represents authorization level for the system.
type Role struct {
    ID          uint8  `gorm:"primaryKey"`
    Name        string `gorm:"uniqueIndex;size:32"`
    Description string `gorm:"size:255"`
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

// User stores credential and identity data.
type User struct {
    ID           uint64     `gorm:"primaryKey"`
    RoleID       uint8      `gorm:"not null"`
    Role         Role       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
    ParentID     *uint64
    Parent       *User      `gorm:"foreignKey:ParentID"`
    FullName     string     `gorm:"size:120"`
    Email        string     `gorm:"uniqueIndex;size:120"`
    PasswordHash string     `gorm:"size:255"`
    Status       string     `gorm:"type:enum('active','inactive');default:'active'"`
    LastLoginAt  *time.Time
    CreatedAt    time.Time
    UpdatedAt    time.Time
}
