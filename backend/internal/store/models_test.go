package store

import (
	"testing"

	"github.com/aridutomo/trexo-backend/internal/domain"
)

// TestTaskToDTO_PriorityCoercion guards the safety net in ToDTO: an empty or
// unrecognized priority (e.g. when the ms_task.priority column hasn't been
// migrated yet, so the field scans as "") must never reach clients as "" — it
// is coerced to the default. Valid values pass through unchanged.
func TestTaskToDTO_PriorityCoercion(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want string
	}{
		{"empty defaults to medium", "", domain.PriorityMedium},
		{"unknown defaults to medium", "critical", domain.PriorityMedium},
		{"low passes through", domain.PriorityLow, domain.PriorityLow},
		{"medium passes through", domain.PriorityMedium, domain.PriorityMedium},
		{"high passes through", domain.PriorityHigh, domain.PriorityHigh},
		{"urgent passes through", domain.PriorityUrgent, domain.PriorityUrgent},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := Task{TaskID: "t_1", Priority: tc.in}.ToDTO(nil)
			if got.Priority != tc.want {
				t.Fatalf("ToDTO priority = %q, want %q (input %q)", got.Priority, tc.want, tc.in)
			}
		})
	}
}
