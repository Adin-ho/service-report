package database

import (
	"fmt"

	"github.com/company/internal-service-report/internal/config"
	"github.com/company/internal-service-report/internal/domain/finance"
	"github.com/company/internal-service-report/internal/domain/partner"
	"github.com/company/internal-service-report/internal/domain/report"
	"github.com/company/internal-service-report/internal/domain/user"
	"github.com/company/internal-service-report/pkg/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// Connect opens a MySQL connection using GORM.
func Connect(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	return db, nil
}

// AutoMigrate syncs schema for all entities.
func AutoMigrate(db *gorm.DB) error {
	if err := db.AutoMigrate(
		&user.Role{},
		&user.User{},
		&report.ServiceReport{},
		&report.ReportPhoto{},
		&report.ReportAttachment{},
		&report.StatusLog{},
		&partner.PartnerLocation{},
		&finance.FinanceActivity{},
		&finance.FinanceActivityItem{},
		&finance.FinanceActivityLog{},
	); err != nil {
		return err
	}

	if !db.Migrator().HasIndex(&report.ServiceReport{}, "idx_status_opened_at") {
		if err := db.Migrator().CreateIndex(&report.ServiceReport{}, "idx_status_opened_at"); err != nil {
			return err
		}
	}
	if !db.Migrator().HasIndex(&report.ServiceReport{}, "idx_opened_at") {
		if err := db.Migrator().CreateIndex(&report.ServiceReport{}, "idx_opened_at"); err != nil {
			return err
		}
	}
	if !db.Migrator().HasIndex(&report.ServiceReport{}, "idx_teknisi_opened_at") {
		if err := db.Migrator().CreateIndex(&report.ServiceReport{}, "idx_teknisi_opened_at"); err != nil {
			return err
		}
	}

	return nil
}

// Seed ensures base roles and master admin.
func Seed(db *gorm.DB, cfg *config.Config) error {
	roles := []user.Role{
		{ID: user.RoleMasterAdminID, Name: user.RoleMasterAdmin, Description: "Super user"},
		{ID: user.RoleAdminID, Name: user.RoleAdmin, Description: "Branch admin"},
		{ID: user.RoleTeknisiID, Name: user.RoleTeknisi, Description: "Technician"},
		{ID: user.RoleFinanceMakerID, Name: user.RoleFinanceMaker, Description: "Finance maker"},
		{ID: user.RoleFinanceCheckerID, Name: user.RoleFinanceChecker, Description: "Finance checker"},
		{ID: user.RoleFinanceSignerID, Name: user.RoleFinanceSigner, Description: "Finance signer"},
	}
	for _, role := range roles {
		if err := db.FirstOrCreate(&role, user.Role{ID: role.ID}).Error; err != nil {
			return fmt.Errorf("seed roles: %w", err)
		}
	}

	var count int64
	if err := db.Model(&user.User{}).Where("role_id = ?", user.RoleMasterAdminID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		hasher := bcrypt.New(12)
		hash, err := hasher.Hash(cfg.SeedMasterPassword)
		if err != nil {
			return err
		}
		master := user.User{
			RoleID:       user.RoleMasterAdminID,
			FullName:     "Master Admin",
			Email:        cfg.SeedMasterEmail,
			PasswordHash: hash,
		}
		if err := db.Create(&master).Error; err != nil {
			return fmt.Errorf("seed master admin: %w", err)
		}
	}

	// Cleanup legacy/dummy finance seed users by configured seed emails (if provided)
	var cleanupEmails []string
	for _, e := range []string{cfg.SeedFinanceMakerEmail, cfg.SeedFinanceCheckerEmail, cfg.SeedFinanceSignerEmail} {
		if e != "" {
			cleanupEmails = append(cleanupEmails, e)
		}
	}
	if len(cleanupEmails) > 0 {
		if err := db.Where("email IN ?", cleanupEmails).Delete(&user.User{}).Error; err != nil {
			return fmt.Errorf("cleanup finance seeds: %w", err)
		}
	}

	return nil
}
