package middleware

import (
	"strings"

	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/aridutomo/trexo-backend/internal/http/respond"
	"github.com/gin-gonic/gin"
)

const HeaderAPIKey = "X-Api-Key"

// APIKey requires X-Api-Key to be in the allowlist. If BFF_API_KEYS is empty the
// check is skipped (local dev). This is defense in depth on top of the session
// token — it ensures only the BFF can call the API even if a token leaks.
func APIKey(keys []string) gin.HandlerFunc {
	set := make(map[string]struct{}, len(keys))
	for _, k := range keys {
		if k = strings.TrimSpace(k); k != "" {
			set[k] = struct{}{}
		}
	}
	return func(c *gin.Context) {
		if len(set) == 0 {
			c.Next()
			return
		}
		if _, ok := set[c.GetHeader(HeaderAPIKey)]; !ok {
			respond.Error(c, domain.ErrUnauth("Invalid API key."))
			c.Abort()
			return
		}
		c.Next()
	}
}
