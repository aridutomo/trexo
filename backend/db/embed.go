// Package db owns the MySQL connection pool and schema migrations.
// Migrations are versioned SQL files embedded into the binary (golang-migrate
// iofs source) and applied on startup — so adding a migration is just dropping
// a new NNNNNN_name.up.sql file into db/migrations and rebuilding.
package db

import "embed"

//go:embed migrations/*.sql
var migrationsFS embed.FS
