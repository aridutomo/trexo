package store

import (
	"database/sql"
	"time"

	"github.com/aridutomo/trexo-backend/internal/domain"
)

// DB row models (snake_case db tags, audit columns present). The ToDTO methods
// mirror gas/Shape.gs: business keys become the frontend id, audit columns are
// dropped, null assigneeId/dueDate become absent (omitempty), times are
// RFC3339Nano UTC (matches JS toISOString()).

type Workspace struct {
	ID           int64          `db:"id"`
	WorkspaceID  string         `db:"workspace_id"`
	Name         string         `db:"name"`
	Type         string         `db:"type"`
	OwnerID      string         `db:"owner_id"`
	Color        string         `db:"color"`
	CreatedBy    sql.NullString `db:"created_by"`
	CreatedTime  time.Time      `db:"created_time"`
	ModifiedBy   sql.NullString `db:"modified_by"`
	ModifiedTime time.Time      `db:"modified_time"`
	IsActive     bool           `db:"is_active"`
}

func (w Workspace) ToDTO() domain.WorkspaceDTO {
	return domain.WorkspaceDTO{
		ID:        w.WorkspaceID,
		Name:      w.Name,
		Type:      w.Type,
		OwnerID:   w.OwnerID,
		Color:     w.Color,
		CreatedAt: w.CreatedTime.UTC().Format(time.RFC3339Nano),
	}
}

type Project struct {
	ID           int64          `db:"id"`
	ProjectID    string         `db:"project_id"`
	WorkspaceID  string         `db:"workspace_id"`
	Name         string         `db:"name"`
	Description  string         `db:"description"`
	Icon         string         `db:"icon"`
	Color        string         `db:"color"`
	CreatedBy    sql.NullString `db:"created_by"`
	CreatedTime  time.Time      `db:"created_time"`
	ModifiedBy   sql.NullString `db:"modified_by"`
	ModifiedTime time.Time      `db:"modified_time"`
	IsActive     bool           `db:"is_active"`
}

func (p Project) ToDTO() domain.ProjectDTO {
	return domain.ProjectDTO{
		ID:          p.ProjectID,
		WorkspaceID: p.WorkspaceID,
		Name:        p.Name,
		Description: p.Description,
		Icon:        p.Icon,
		Color:       p.Color,
		CreatedAt:   p.CreatedTime.UTC().Format(time.RFC3339Nano),
	}
}

type Step struct {
	ID           int64          `db:"id"`
	StepID       string         `db:"step_id"`
	TaskID       string         `db:"task_id"`
	Name         string         `db:"name"`
	Completed    bool           `db:"completed"`
	Position     int            `db:"position"`
	CreatedBy    sql.NullString `db:"created_by"`
	CreatedTime  time.Time      `db:"created_time"`
	ModifiedBy   sql.NullString `db:"modified_by"`
	ModifiedTime time.Time      `db:"modified_time"`
	IsActive     bool           `db:"is_active"`
}

func (s Step) ToDTO() domain.StepDTO {
	return domain.StepDTO{ID: s.StepID, Name: s.Name, Completed: s.Completed}
}

type Task struct {
	ID           int64          `db:"id"`
	TaskID       string         `db:"task_id"`
	ProjectID    string         `db:"project_id"`
	Name         string         `db:"name"`
	Description  string         `db:"description"`
	Status       string         `db:"status"`
	Source       string         `db:"source"`
	Difficulty   string         `db:"difficulty"`
	Priority     string         `db:"priority"`
	AssigneeID   sql.NullString `db:"assignee_id"`
	DueDate      sql.NullTime   `db:"due_date"`
	CreatedBy    sql.NullString `db:"created_by"`
	CreatedTime  time.Time      `db:"created_time"`
	ModifiedBy   sql.NullString `db:"modified_by"`
	ModifiedTime time.Time      `db:"modified_time"`
	IsActive     bool           `db:"is_active"`
}

// ToDTO shapes the task. steps may be nil (task.update/task.move return steps:[]);
// the Steps slice is always non-nil so JSON renders [] (parity with gas/Task.gs).
func (t Task) ToDTO(steps []Step) domain.TaskDTO {
	// Priority may be empty if the ms_task.priority column hasn't been migrated
	// yet (migration 000002 adds it). Never expose an invalid value to clients —
	// fall back to the default so the frontend never sees an empty priority.
	priority := t.Priority
	if !domain.IsValidPriority(priority) {
		priority = domain.PriorityMedium
	}
	out := domain.TaskDTO{
		ID:          t.TaskID,
		ProjectID:   t.ProjectID,
		Name:        t.Name,
		Description: t.Description,
		Status:      t.Status,
		Source:      t.Source,
		Difficulty:  t.Difficulty,
		Priority:    priority,
		Steps:       []domain.StepDTO{},
		CreatedAt:   t.CreatedTime.UTC().Format(time.RFC3339Nano),
		UpdatedAt:   t.ModifiedTime.UTC().Format(time.RFC3339Nano),
	}
	if t.AssigneeID.Valid {
		out.AssigneeID = t.AssigneeID.String
	}
	if t.DueDate.Valid {
		out.DueDate = t.DueDate.Time.UTC().Format(time.RFC3339Nano)
	}
	for _, s := range steps {
		out.Steps = append(out.Steps, s.ToDTO())
	}
	return out
}

type Comment struct {
	ID           int64          `db:"id"`
	CommentID    string         `db:"comment_id"`
	TaskID       string         `db:"task_id"`
	UserID       string         `db:"user_id"`
	Content      string         `db:"content"`
	CreatedBy    sql.NullString `db:"created_by"`
	CreatedTime  time.Time      `db:"created_time"`
	ModifiedBy   sql.NullString `db:"modified_by"`
	ModifiedTime time.Time      `db:"modified_time"`
	IsActive     bool           `db:"is_active"`
}

func (c Comment) ToDTO() domain.CommentDTO {
	return domain.CommentDTO{
		ID:        c.CommentID,
		TaskID:    c.TaskID,
		UserID:    c.UserID,
		Content:   c.Content,
		CreatedAt: c.CreatedTime.UTC().Format(time.RFC3339Nano),
	}
}
