package db

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/achadinhos/backend/internal/config"
	"github.com/achadinhos/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// New opens a GORM connection to PostgreSQL using the provided config.
// It does NOT run migrations — those are handled separately via golang-migrate.
func New(cfg *config.Config) (*gorm.DB, error) {
	gormLogger := logger.New(
		newSlogWriter(),
		logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: true,
			Colorful:                  false,
		},
	)

	gdb, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger:                                   gormLogger,
		DisableForeignKeyConstraintWhenMigrating: false,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open postgres: %w", err)
	}

	sqlDB, err := gdb.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to access underlying sql.DB: %w", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(50)
	sqlDB.SetConnMaxLifetime(time.Hour)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping postgres: %w", err)
	}

	return gdb, nil
}

// AutoMigrate runs GORM's auto-migration for all models. Used as a fallback
// in dev/test environments when SQL migrations have not been applied. In production,
// prefer running `make migrate-up` against the SQL files in /migrations.
func AutoMigrate(gdb *gorm.DB) error {
	return gdb.AutoMigrate(
		&models.User{},
		&models.Condominio{},
		&models.Category{},
		&models.Provider{},
		&models.Review{},
		&models.ReviewHelpful{},
		&models.Favorite{},
		&models.Seller{},
		&models.SellerReview{},
		&models.Product{},
		&models.ProductPhoto{},
		&models.PortfolioPhoto{},
		&models.RefreshToken{},
		&models.FichaCadastro{},
		&models.Event{},
		&models.EventDay{},
		&models.Banner{},
		&models.Certificate{},
		&models.BlogPost{},
	)
}

// slogWriter adapts log/slog to the io.Writer-like interface gorm logger expects via Printf.
type slogWriter struct{}

func newSlogWriter() *slogWriter { return &slogWriter{} }

func (w *slogWriter) Printf(format string, args ...any) {
	slog.Debug("gorm", "msg", fmt.Sprintf(format, args...))
}
