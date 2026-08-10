// Package middleware holds cross-cutting gin handlers: recovery, request id,
// access logging, CORS, and the optional shared-secret API-key gate.
package middleware

import (
	"fmt"
	"log/slog"
	"runtime/debug"

	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/aridutomo/trexo-backend/internal/http/respond"
	"github.com/gin-gonic/gin"
)

// Recover catches panics and returns 500 INTERNAL with a stack trace logged.
func Recover() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				slog.Error("panic recovered", "err", r, "stack", string(debug.Stack()))
				respond.Error(c, domain.ErrInternal(fmt.Errorf("panic: %v", r)))
				c.Abort()
			}
		}()
		c.Next()
	}
}
