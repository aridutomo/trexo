// Package respond centralizes JSON responses so the error envelope never drifts.
package respond

import (
	"database/sql"
	"errors"
	"log/slog"
	"net/http"

	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/gin-gonic/gin"
)

// OK writes data with the given status.
func OK(c *gin.Context, status int, data any) {
	c.JSON(status, data)
}

// Created writes data with 201.
func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, data)
}

// Error writes {"error":{"code","message"}} mapping domain codes to HTTP status.
// sql.ErrNoRows from the store layer is mapped to 404 NOT_FOUND. INTERNAL errors
// are logged with the cause but the cause text is never sent to the client.
func Error(c *gin.Context, err error) {
	if errors.Is(err, sql.ErrNoRows) {
		err = domain.ErrNotFound("")
	}
	ae := domain.AsAppError(err)
	status := statusFor(ae.Code)
	msg := ae.Message
	if ae.Code == domain.CodeInternal {
		slog.Error("internal error",
			"err", ae.Cause,
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
		)
		msg = "Internal error."
	}
	c.JSON(status, gin.H{"error": gin.H{"code": ae.Code, "message": msg}})
}

func statusFor(code domain.Code) int {
	switch code {
	case domain.CodeUnauth:
		return http.StatusUnauthorized
	case domain.CodeForbidden:
		return http.StatusForbidden
	case domain.CodeNotFound:
		return http.StatusNotFound
	case domain.CodeValidation:
		return http.StatusUnprocessableEntity
	default:
		return http.StatusInternalServerError
	}
}
