package store

import "context"

// AuthzReader implementation on *Stores. These are single-row, indexed lookups
// used by domain.UserOwnsWorkspace / UserCanAccessProject / UserCanAccessTask.
// A missing row returns sql.ErrNoRows which the domain layer maps to (false,nil).

func (s *Stores) WorkspaceOwner(ctx context.Context, workspaceID string) (string, error) {
	var o string
	err := s.DB.GetContext(ctx, &o,
		`SELECT owner_id FROM ms_workspace WHERE workspace_id = ? LIMIT 1`, workspaceID)
	return o, err
}

func (s *Stores) ProjectWorkspace(ctx context.Context, projectID string) (string, bool, error) {
	var row struct {
		WorkspaceID string `db:"workspace_id"`
		IsActive    bool   `db:"is_active"`
	}
	err := s.DB.GetContext(ctx, &row,
		`SELECT workspace_id, is_active FROM ms_project WHERE project_id = ? LIMIT 1`, projectID)
	return row.WorkspaceID, row.IsActive, err
}

func (s *Stores) TaskProject(ctx context.Context, taskID string) (string, error) {
	var p string
	err := s.DB.GetContext(ctx, &p,
		`SELECT project_id FROM ms_task WHERE task_id = ? LIMIT 1`, taskID)
	return p, err
}
