package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/aridutomo/trexo-backend/db"
	"github.com/aridutomo/trexo-backend/internal/config"
	"github.com/aridutomo/trexo-backend/internal/server"
	"github.com/aridutomo/trexo-backend/internal/store"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	dbx, err := db.Open(cfg.DSN)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer dbx.Close()

	// Schema migrations are embedded; applied on startup (idempotent). Migrate
	// opens its own throwaway connection (it must not close the app's pool).
	if cfg.RunMigrations {
		log.Println("applying migrations...")
		if err := db.Migrate(cfg.DSN); err != nil {
			log.Fatalf("migrate: %v", err)
		}
		log.Println("migrations applied")
	}

	stores := store.NewStores(dbx)
	router := server.NewRouter(stores, cfg)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("trexo backend listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("shutdown: %v", err)
	}
}
