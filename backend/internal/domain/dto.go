package domain

// Response DTOs (camelCase JSON). Must match src/lib/types.ts exactly.
//
// Notes:
//   - TaskDTO.Steps serializes as [] (never null): handlers set a non-nil empty
//     slice. task.update / task.move deliberately return steps:[] (parity with
//     gas/Task.gs: the frontend manages steps separately via taskstep.* routes).
//   - AssigneeID / DueDate use omitempty so a null DB value becomes absent
//     (undefined) in JSON, matching gas/Shape.gs.

type WorkspaceDTO struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Type      string `json:"type"`
	OwnerID   string `json:"ownerId"`
	Color     string `json:"color"`
	CreatedAt string `json:"createdAt"`
}

type ProjectDTO struct {
	ID          string `json:"id"`
	WorkspaceID string `json:"workspaceId"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
	CreatedAt   string `json:"createdAt"`
}

type StepDTO struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Completed bool   `json:"completed"`
}

type TaskDTO struct {
	ID          string    `json:"id"`
	ProjectID   string    `json:"projectId"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	Source      string    `json:"source"`
	Difficulty  string    `json:"difficulty"`
	Priority    string    `json:"priority"`
	Steps       []StepDTO `json:"steps"`
	AssigneeID  string    `json:"assigneeId,omitempty"`
	DueDate     string    `json:"dueDate,omitempty"`
	CreatedAt   string    `json:"createdAt"`
	UpdatedAt   string    `json:"updatedAt"`
}

type CommentDTO struct {
	ID        string `json:"id"`
	TaskID    string `json:"taskId"`
	UserID    string `json:"userId"`
	Content   string `json:"content"`
	CreatedAt string `json:"createdAt"`
}

// NotificationDTO is the shape of a reminder/notification row. Must match
// src/lib/types.ts (Notification). dueAt/readAt/projectId use omitempty so a
// NULL DB column becomes absent (undefined) in JSON.
type NotificationDTO struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Severity    string `json:"severity"`
	Title       string `json:"title"`
	Body        string `json:"body"`
	RefType     string `json:"refType"`
	RefID       string `json:"refId"`
	ProjectID   string `json:"projectId,omitempty"`
	DueAt       string `json:"dueAt,omitempty"`
	TargetURL   string `json:"targetUrl"`
	IsRead      bool   `json:"isRead"`
	IsDismissed bool   `json:"isDismissed"`
	CreatedAt   string `json:"createdAt"`
	ReadAt      string `json:"readAt,omitempty"`
}

// DeletedDTO is the {id, deleted:true} shape for delete operations.
type DeletedDTO struct {
	ID      string `json:"id"`
	Deleted bool   `json:"deleted"`
}
