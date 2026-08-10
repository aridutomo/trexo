package store

import (
	"context"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

type WorkspaceStore struct {
	DB *sqlx.DB
}

type WorkspaceCreate struct {
	WorkspaceID string
	Name        string
	Type        string
	OwnerID     string
	Color       string
	CreatedBy   string
}

// WorkspacePatch holds optional update fields. nil pointer = leave unchanged.
type WorkspacePatch struct {
	Name  *string
	Type  *string
	Color *string
}

func (s *WorkspaceStore) ListByOwner(ctx context.Context, ownerID string) ([]Workspace, error) {
	var ws []Workspace
	err := s.DB.SelectContext(ctx, &ws,
		`SELECT * FROM ms_workspace WHERE owner_id = ? AND is_active = 1 ORDER BY created_time ASC`, ownerID)
	return ws, err
}

func (s *WorkspaceStore) GetByID(ctx context.Context, id string) (Workspace, error) {
	var w Workspace
	err := s.DB.GetContext(ctx, &w,
		`SELECT * FROM ms_workspace WHERE workspace_id = ? LIMIT 1`, id)
	return w, err
}

func (s *WorkspaceStore) Create(ctx context.Context, in WorkspaceCreate) (Workspace, error) {
	now := time.Now().UTC()
	cb := nullStr(in.CreatedBy)
	_, err := s.DB.ExecContext(ctx,
		`INSERT INTO ms_workspace
		   (workspace_id, name, type, owner_id, color, created_by, created_time, modified_by, modified_time, is_active)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
		in.WorkspaceID, in.Name, in.Type, in.OwnerID, in.Color, cb, now, cb, now)
	if err != nil {
		return Workspace{}, err
	}
	return s.GetByID(ctx, in.WorkspaceID)
}

func (s *WorkspaceStore) Update(ctx context.Context, id string, p WorkspacePatch, modifiedBy string) (Workspace, error) {
	sets := []string{}
	args := []any{}
	if p.Name != nil {
		sets = append(sets, "name = ?")
		args = append(args, *p.Name)
	}
	if p.Type != nil {
		sets = append(sets, "type = ?")
		args = append(args, *p.Type)
	}
	if p.Color != nil {
		sets = append(sets, "color = ?")
		args = append(args, *p.Color)
	}
	if len(sets) == 0 {
		return s.GetByID(ctx, id) // nothing to change
	}
	sets = append(sets, "modified_by = ?", "modified_time = ?")
	args = append(args, nullStr(modifiedBy), time.Now().UTC(), id)
	q := "UPDATE ms_workspace SET " + strings.Join(sets, ", ") + " WHERE workspace_id = ?"
	if _, err := s.DB.ExecContext(ctx, q, args...); err != nil {
		return Workspace{}, err
	}
	return s.GetByID(ctx, id)
}

// Delete hard-deletes the workspace. ms_project has ON DELETE RESTRICT, so this
// fails if projects remain — handlers pre-check and return VALIDATION.
func (s *WorkspaceStore) Delete(ctx context.Context, id string) error {
	_, err := s.DB.ExecContext(ctx, `DELETE FROM ms_workspace WHERE workspace_id = ?`, id)
	return err
}
