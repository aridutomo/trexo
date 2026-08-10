// Package handler implements the REST handlers for /api/v1. Each handler binds
// the request, runs ownership checks (port of gas/Utils.gs), calls the store,
// and shapes the response DTO (port of gas/Shape.gs).
package handler

import (
	"fmt"
	"time"

	"github.com/aridutomo/trexo-backend/internal/auth"
	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/aridutomo/trexo-backend/internal/http/respond"
	"github.com/aridutomo/trexo-backend/internal/store"
	"github.com/gin-gonic/gin"
)

// API holds the store dependency shared by all handlers.
type API struct {
	S *store.Stores
}

func New(s *store.Stores) *API { return &API{S: s} }

func userID(c *gin.Context) string { return auth.UserID(c) }

func badRequest(c *gin.Context, err error) {
	respond.Error(c, domain.ErrValidation(err.Error()))
}

func forbidden(c *gin.Context) {
	respond.Error(c, domain.ErrForbidden(""))
}

// parseISO parses an RFC3339(Nano) date string (frontend dueDate). "" → nil.
func parseISO(s string) (*time.Time, error) {
	if s == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339Nano, s)
	if err != nil {
		t, err = time.Parse(time.RFC3339, s)
		if err != nil {
			return nil, fmt.Errorf("invalid date %q: %w", s, err)
		}
	}
	utc := t.UTC()
	return &utc, nil
}

func defaultStr(v, def string) string {
	if v == "" {
		return def
	}
	return v
}
