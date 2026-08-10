package db

import (
	"context"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql" // register the mysql driver
	"github.com/jmoiron/sqlx"
)

// Open creates the sqlx pool over MySQL and waits until it accepts connections.
// The DSN MUST include parseTime=true, loc=UTC and charset=utf8mb4:
//   - parseTime=true: scans DATETIME columns into time.Time (without it
//     expires_at scans into a string and session verification breaks silently).
//   - loc=UTC: every scanned time.Time is UTC (matches DATETIME(3) storage and
//     the RFC3339Nano ISO output the frontend expects).
//   - charset=utf8mb4: 4-byte UTF-8 (emoji icons like 📁).
// config.Load enforces parseTime; the rest is documented in .env.example.
//
// The retry loop covers the brief window where the MySQL container reports
// healthy (mysqladmin ping) a moment before it accepts app connections.
func Open(dsn string) (*sqlx.DB, error) {
	dbx, err := sqlx.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("open mysql: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	var lastErr error
	for {
		if err := dbx.PingContext(ctx); err == nil {
			break
		}
		lastErr = err
		if ctx.Err() != nil {
			dbx.Close()
			return nil, fmt.Errorf("mysql not ready after 30s: %w", lastErr)
		}
		time.Sleep(500 * time.Millisecond)
	}

	dbx.SetMaxOpenConns(25)
	dbx.SetMaxIdleConns(5)
	return dbx, nil
}
