package store

import (
	"context"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

type ProjectStore struct {
	DB *sqlx.DB
}

type ProjectCreate struct {
	ProjectID   string
	WorkspaceID string
	Name        string
	Description string
	Icon        string
	Color       string
	CreatedBy   string
}

type ProjectPatch struct {
	Name        *string
	Description *string
	Icon        *string
	Color       *string
}

func (s *ProjectStore) ListByWorkspace(ctx context.Context, workspaceID string) ([]Project, error) {
	var ps []Project
	err := s.DB.SelectContext(ctx, &ps,
		`SELECT * FROM ms_project WHERE workspace_id = ? AND is_active = 1 ORDER BY created_time ASC`, workspaceID)
	return ps, err
}

func (s *ProjectStore) GetByID(ctx context.Context, id string) (Project, error) {
	var p Project
	err := s.DB.GetContext(ctx, &p,
		`SELECT * FROM ms_project WHERE project_id = ? LIMIT 1`, id)
	return p, err
}

// CountByWorkspace is the workspace-delete pre-check (RESTRICT → 422).
func (s *ProjectStore) CountByWorkspace(ctx context.Context, workspaceID string) (int, error) {
	var n int
	err := s.DB.GetContext(ctx, &n,
		`SELECT COUNT(*) FROM ms_project WHERE workspace_id = ? AND is_active = 1`, workspaceID)
	return n, err
}

func (s *ProjectStore) Create(ctx context.Context, in ProjectCreate) (Project, error) {
	now := time.Now().UTC()
	cb := nullStr(in.CreatedBy)
	desc := in.Description // schema default NOT NULL but we always supply "" (parity with GAS)
	_, err := s.DB.ExecContext(ctx,
		`INSERT INTO ms_project
		   (project_id, workspace_id, name, description, icon, color, created_by, created_time, modified_by, modified_time, is_active)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
		in.ProjectID, in.WorkspaceID, in.Name, desc, in.Icon, in.Color, cb, now, cb, now)
	if err != nil {
		return Project{}, err
	}
	return s.GetByID(ctx, in.ProjectID)
}

func (s *ProjectStore) Update(ctx context.Context, id string, p ProjectPatch, modifiedBy string) (Project, error) {
	sets := []string{}
	args := []any{}
	if p.Name != nil {
		sets = append(sets, "name = ?")
		args = append(args, *p.Name)
	}
	if p.Description != nil {
		sets = append(sets, "description = ?")
		args = append(args, *p.Description)
	}
	if p.Icon != nil {
		sets = append(sets, "icon = ?")
		args = append(args, *p.Icon)
	}
	if p.Color != nil {
		sets = append(sets, "color = ?")
		args = append(args, *p.Color)
	}
	if len(sets) == 0 {
		return s.GetByID(ctx, id)
	}
	sets = append(sets, "modified_by = ?", "modified_time = ?")
	args = append(args, nullStr(modifiedBy), time.Now().UTC(), id)
	q := "UPDATE ms_project SET " + strings.Join(sets, ", ") + " WHERE project_id = ?"
	if _, err := s.DB.ExecContext(ctx, q, args...); err != nil {
		return Project{}, err
	}
	return s.GetByID(ctx, id)
}

// Delete removes the project; ms_task ON DELETE CASCADE removes its tasks and
// their steps + comments.
func (s *ProjectStore) Delete(ctx context.Context, id string) error {
	_, err := s.DB.ExecContext(ctx, `DELETE FROM ms_project WHERE project_id = ?`, id)
	return err
}
