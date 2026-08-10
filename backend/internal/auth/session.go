// Package auth verifies the better-auth session token forwarded by the Next.js
// BFF (header X-Session-Token). better-auth stores the token plaintext in the
// `session` table, so verification is an exact-match lookup + expiry check.
package auth

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/jmoiron/sqlx"
)

// ErrInvalidSession means the token was missing, unknown, or expired.
var ErrInvalidSession = errors.New("invalid or expired session")

// Verifier resolves a userId from a raw session token.
type Verifier struct {
	DB *sqlx.DB
}

// UserIDFromToken looks up the token in better-auth's `session` table and
// returns the userId if the session exists and has not expired.
//
// better-auth emits camelCase column names (userId, expiresAt, createdAt, ...).
// Confirm with `DESCRIBE session;` after running `npx @better-auth/cli migrate`.
// If a future better-auth version emits snake_case, change this query + tags.
func (v *Verifier) UserIDFromToken(ctx context.Context, token string) (string, error) {
	var row struct {
		UserID    string    `db:"userId"`
		ExpiresAt time.Time `db:"expiresAt"`
	}
	err := v.DB.GetContext(ctx, &row,
		`SELECT userId, expiresAt FROM session WHERE token = ? LIMIT 1`, token)
	if errors.Is(err, sql.ErrNoRows) {
		return "", ErrInvalidSession
	}
	if err != nil {
		return "", err
	}
	if time.Now().After(row.ExpiresAt) {
		return "", ErrInvalidSession
	}
	return row.UserID, nil
}
