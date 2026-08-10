package domain

import (
	"crypto/rand"
	"fmt"
)

const idAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

// GenID generates a business key: prefix + "_" + 16 random alphanumeric chars.
// Mirrors gas/Ids.gs. Uses crypto/rand (not math/rand) so IDs are not
// predictable; the UNIQUE constraint on each *_id column is the final guarantee.
func GenID(prefix string) string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		// crypto/rand failure is catastrophic — crash rather than emit a
		// predictable/duplicate id.
		panic(fmt.Sprintf("crypto/rand failed: %v", err))
	}
	for i := range b {
		b[i] = idAlphabet[int(b[i])%len(idAlphabet)]
	}
	return prefix + "_" + string(b)
}
