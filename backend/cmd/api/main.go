package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/achadinhos/backend/internal/config"
	"github.com/achadinhos/backend/internal/db"
	"github.com/achadinhos/backend/internal/router"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "err", err)
		os.Exit(1)
	}

	setupLogger(cfg.AppLogLevel)

	gdb, err := db.New(cfg)
	if err != nil {
		slog.Error("failed to connect to db", "err", err)
		os.Exit(1)
	}

	// Auto-migrate as a safety net for fresh installs (idempotent).
	if err := db.AutoMigrate(gdb); err != nil {
		slog.Warn("auto-migrate non-fatal error", "err", err)
	}

	// Insert any missing canonical categories. Idempotent — existing rows
	// are left untouched, so new categories rolled out via deploy show up
	// without manual migrations.
	if err := db.EnsureCategories(context.Background(), gdb); err != nil {
		slog.Warn("ensure-categories non-fatal error", "err", err)
	}

	// Espelha a categoria principal das empresas na tabela de junção
	// seller_categories (multi-categoria). Idempotente.
	if err := db.EnsureSellerCategories(context.Background(), gdb); err != nil {
		slog.Warn("ensure-seller-categories non-fatal error", "err", err)
	}

	// Ajusta o schema dos certificados (seller_id nullable) e ressincroniza o
	// selo de nível em sellers/providers. Idempotente.
	if err := db.EnsureCertificateSchema(context.Background(), gdb); err != nil {
		slog.Warn("ensure-certificate-schema non-fatal error", "err", err)
	}

	// Copia data/hora de eventos antigos para event_days. Idempotente.
	if err := db.EnsureEventDays(context.Background(), gdb); err != nil {
		slog.Warn("ensure-event-days non-fatal error", "err", err)
	}

	r := router.New(cfg, gdb)

	srv := &http.Server{
		Addr:              ":" + cfg.AppPort,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Graceful shutdown.
	go func() {
		slog.Info("server listening", "port", cfg.AppPort, "env", cfg.AppEnv)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	slog.Info("shutting down")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("shutdown error", "err", err)
	}
}

func setupLogger(level string) {
	var lvl slog.Level
	switch level {
	case "debug":
		lvl = slog.LevelDebug
	case "warn":
		lvl = slog.LevelWarn
	case "error":
		lvl = slog.LevelError
	default:
		lvl = slog.LevelInfo
	}
	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: lvl})
	slog.SetDefault(slog.New(h))
}
