package db

import (
	"database/sql"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/mysql"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

// Migrate applies all pending up migrations embedded in the binary. Safe to
// call on every startup: ErrNoChange (no pending migrations) is treated as success.
//
// IMPORTANT: this opens a DEDICATED *sql.DB for migrations and closes it when
// done. golang-migrate's mysql driver Close() closes the *sql.DB it is handed,
// so we must never pass the app's pool here (that would close it and break all
// later queries with "sql: database is closed").
func Migrate(dsn string) error {
	src, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("migrate source: %w", err)
	}

	mdb, err := sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("migrate open: %w", err)
	}
	defer mdb.Close()

	inst, err := mysql.WithInstance(mdb, &mysql.Config{})
	if err != nil {
		return fmt.Errorf("migrate instance: %w", err)
	}
	m, err := migrate.NewWithInstance("iofs", src, "mysql", inst)
	if err != nil {
		return fmt.Errorf("migrate new: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migrate up: %w", err)
	}
	return nil
}
