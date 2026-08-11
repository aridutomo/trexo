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

// DeletedDTO is the {id, deleted:true} shape for delete operations.
type DeletedDTO struct {
	ID      string `json:"id"`
	Deleted bool   `json:"deleted"`
}
