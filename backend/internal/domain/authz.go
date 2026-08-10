package domain

import (
	"context"
	"database/sql"
	"errors"
)

// AuthzReader is the subset of store reads needed for authorization. Implemented
// by *store.Stores so the domain package stays free of sqlx imports.
type AuthzReader interface {
	WorkspaceOwner(ctx context.Context, workspaceID string) (ownerID string, err error)
	ProjectWorkspace(ctx context.Context, projectID string) (workspaceID string, active bool, err error)
	TaskProject(ctx context.Context, taskID string) (projectID string, err error)
}

// UserOwnsWorkspace reports whether userID owns the workspace. A missing row
// returns (false, nil) — handlers that need a 404 do their own existence fetch.
func UserOwnsWorkspace(ctx context.Context, r AuthzReader, workspaceID, userID string) (bool, error) {
	owner, err := r.WorkspaceOwner(ctx, workspaceID)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return owner == userID, nil
}

// UserCanAccessProject reports whether userID owns the workspace that owns the
// project (project must be active). Mirrors gas/Utils.gs userCanAccessProject.
func UserCanAccessProject(ctx context.Context, r AuthzReader, projectID, userID string) (bool, error) {
	ws, active, err := r.ProjectWorkspace(ctx, projectID)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if !active {
		return false, nil
	}
	return UserOwnsWorkspace(ctx, r, ws, userID)
}

// UserCanAccessTask reports whether userID owns the workspace owning the task's
// project. Mirrors gas/Utils.gs userCanAccessTask.
func UserCanAccessTask(ctx context.Context, r AuthzReader, taskID, userID string) (bool, error) {
	pid, err := r.TaskProject(ctx, taskID)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return UserCanAccessProject(ctx, r, pid, userID)
}
