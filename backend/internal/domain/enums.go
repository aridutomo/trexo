package domain

// Enum value sets mirror src/lib/types.ts and the MySQL ENUM columns. gin's
// `oneof` validator enforces these on input; the ENUM column enforces again on
// write (defense in depth). Defaults match gas/*.gs handlers.

const (
	StatusTodo       = "todo"
	StatusInProgress = "in_progress"
	StatusReview     = "review"
	StatusDone       = "done"

	SourceOwnIdea     = "own_idea"
	SourceUserRequest = "user_request"

	DifficultyEasy   = "easy"
	DifficultyMedium = "medium"
	DifficultyHard   = "hard"

	PriorityLow    = "low"
	PriorityMedium = "medium"
	PriorityHigh   = "high"
	PriorityUrgent = "urgent"

	TypePersonal = "personal"
	TypeCompany  = "company"

	// Notification types. task_overdue = lewat due_date; task_due_soon = dalam
	// ambang batas (default 3 hari). task_assigned/comment_mention reserved for
	// future use (generator hanya emit task_* saat ini).
	NtfTaskOverdue    = "task_overdue"
	NtfTaskDueSoon    = "task_due_soon"
	NtfTaskAssigned   = "task_assigned"
	NtfCommentMention = "comment_mention"

	// Notification severity -> warna UI (info / warning / urgent).
	NtfSeverityInfo    = "info"
	NtfSeverityWarning = "warning"
	NtfSeverityUrgent  = "urgent"
)

func IsValidNotificationType(s string) bool {
	switch s {
	case NtfTaskOverdue, NtfTaskDueSoon, NtfTaskAssigned, NtfCommentMention:
		return true
	}
	return false
}

func IsValidNotificationSeverity(s string) bool {
	switch s {
	case NtfSeverityInfo, NtfSeverityWarning, NtfSeverityUrgent:
		return true
	}
	return false
}

func IsValidStatus(s string) bool {
	switch s {
	case StatusTodo, StatusInProgress, StatusReview, StatusDone:
		return true
	}
	return false
}

func IsValidSource(s string) bool {
	return s == SourceOwnIdea || s == SourceUserRequest
}

func IsValidDifficulty(s string) bool {
	switch s {
	case DifficultyEasy, DifficultyMedium, DifficultyHard:
		return true
	}
	return false
}

func IsValidPriority(s string) bool {
	switch s {
	case PriorityLow, PriorityMedium, PriorityHigh, PriorityUrgent:
		return true
	}
	return false
}

func IsValidWorkspaceType(s string) bool {
	return s == TypePersonal || s == TypeCompany
}
