// Package config loads runtime configuration from environment variables.
package config

import (
	"fmt"
	"os"
	"strings"
)

// Config holds all runtime settings for the server.
type Config struct {
	Port           string
	GoEnv          string
	DSN            string // MySQL DSN (must include parseTime=true&loc=UTC&charset=utf8mb4)
	AllowedOrigins []string
	BFFAPIKeys     []string // optional shared-secret allowlist (defense in depth)
	RunMigrations  bool
}

// Load reads configuration from the environment. Required vars panic via error.
func Load() (*Config, error) {
	port := envOrDefault("PORT", "8080")
	dsn := os.Getenv("DSN")
	if dsn == "" {
		return nil, fmt.Errorf("DSN environment variable is required")
	}
	// Guard the two non-negotiable DSN params (see db.Open for the why).
	if !strings.Contains(dsn, "parseTime=true") {
		return nil, fmt.Errorf("DSN must include parseTime=true (expires_at scans into time.Time)")
	}

	return &Config{
		Port:           port,
		GoEnv:          envOrDefault("GO_ENV", "development"),
		DSN:            dsn,
		AllowedOrigins: splitCSV(os.Getenv("ALLOWED_ORIGINS")),
		BFFAPIKeys:     splitCSV(os.Getenv("BFF_API_KEYS")),
		RunMigrations:  envOrDefault("RUN_MIGRATIONS", "true") == "true",
	}, nil
}

// IsProduction reports whether the server runs in release mode.
func (c *Config) IsProduction() bool { return c.GoEnv == "production" }

func envOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func splitCSV(v string) []string {
	v = strings.TrimSpace(v)
	if v == "" {
		return nil
	}
	parts := strings.Split(v, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
