package auth

import (
	"strings"

	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/aridutomo/trexo-backend/internal/http/respond"
	"github.com/gin-gonic/gin"
)

const (
	// HeaderSessionToken carries the raw better-auth session token, set by the
	// Next.js BFF after resolving the caller's session.
	HeaderSessionToken = "X-Session-Token"
	// CtxUserID is the gin-context key for the authenticated user id.
	CtxUserID = "ctx.userId"
)

// Middleware verifies X-Session-Token and stores the userId in the gin context.
// Aborts with 401 UNAUTH on any failure.
func Middleware(v *Verifier) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := strings.TrimSpace(c.GetHeader(HeaderSessionToken))
		if token == "" {
			respond.Error(c, domain.ErrUnauth("Missing session token."))
			c.Abort()
			return
		}
		userID, err := v.UserIDFromToken(c.Request.Context(), token)
		if err != nil {
			respond.Error(c, domain.ErrUnauth("Invalid or expired session."))
			c.Abort()
			return
		}
		c.Set(CtxUserID, userID)
		c.Next()
	}
}

// UserID returns the authenticated user id from the gin context ("" if unset).
func UserID(c *gin.Context) string {
	v, ok := c.Get(CtxUserID)
	if !ok {
		return ""
	}
	s, _ := v.(string)
	return s
}
