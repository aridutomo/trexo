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

	TypePersonal = "personal"
	TypeCompany  = "company"
)

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

func IsValidWorkspaceType(s string) bool {
	return s == TypePersonal || s == TypeCompany
}
