package store

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/jmoiron/sqlx"
)

type TaskStore struct {
	DB *sqlx.DB
}

type TaskCreate struct {
	TaskID      string
	ProjectID   string
	Name        string
	Description string
	Status      string
	Source      string
	Difficulty  string
	Priority    string
	AssigneeID  string     // empty -> column NULL
	DueDate     *time.Time // nil -> column NULL
	StepNames   []string   // initial steps, bulk inserted at positions 0..n-1
	CreatedBy   string
}

// TaskPatch holds optional update fields. Pointer fields: nil = unchanged.
// Assignee/Due use a change-flag because clearing to NULL must be
// distinguishable from "not sent" (parity with gas/Task.gs which uses
// `payload.assigneeId !== undefined`).
type TaskPatch struct {
	Name        *string
	Description *string
	Status      *string
	Source      *string
	Difficulty  *string
	Priority    *string

	AssigneeChange bool   // true -> update the column
	AssigneeValue  string // when Change && "" -> set NULL

	DueChange bool       // true -> update the column
	DueValue  *time.Time // when Change && nil -> set NULL
}

func (s *TaskStore) ListByProject(ctx context.Context, projectID string) ([]Task, error) {
	var ts []Task
	err := s.DB.SelectContext(ctx, &ts,
		`SELECT * FROM ms_task WHERE project_id = ? AND is_active = 1 ORDER BY created_time ASC`, projectID)
	return ts, err
}

func (s *TaskStore) GetByID(ctx context.Context, id string) (Task, error) {
	var t Task
	err := s.DB.GetContext(ctx, &t,
		`SELECT * FROM ms_task WHERE task_id = ? AND is_active = 1 LIMIT 1`, id)
	return t, err
}

// GetByIDAny is like GetByID but ignores is_active (for ownership lookups on
// rows that may be inactive). Currently equivalent to GetByID since deletes are
// hard; kept for parity with GAS which queried without is_active in some paths.
func (s *TaskStore) GetByIDAny(ctx context.Context, id string) (Task, error) {
	var t Task
	err := s.DB.GetContext(ctx, &t, `SELECT * FROM ms_task WHERE task_id = ? LIMIT 1`, id)
	return t, err
}

// CreateWithSteps inserts the task then its initial steps in one transaction,
// then reads both back. Mirrors gas/Task.gs create (genId per step, position=index).
func (s *TaskStore) CreateWithSteps(ctx context.Context, in TaskCreate) (Task, []Step, error) {
	var task Task
	steps := []Step{}
	now := time.Now().UTC()
	cb := nullStr(in.CreatedBy)
	var assignee any
	if in.AssigneeID != "" {
		assignee = in.AssigneeID
	} else {
		assignee = nil
	}
	var due any
	if in.DueDate != nil {
		due = *in.DueDate
	} else {
		due = nil
	}

	err := runTx(ctx, s.DB, func(tx *sqlx.Tx) error {
		_, err := tx.ExecContext(ctx,
			`INSERT INTO ms_task
			   (task_id, project_id, name, description, status, source, difficulty, priority,
			    assignee_id, due_date, created_by, created_time, modified_by, modified_time, is_active)
			 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
			in.TaskID, in.ProjectID, in.Name, in.Description, in.Status, in.Source, in.Difficulty, in.Priority,
			assignee, due, cb, now, cb, now)
		if err != nil {
			return err
		}

		for i, name := range in.StepNames {
			_, err := tx.ExecContext(ctx,
				`INSERT INTO tr_task_step
				   (step_id, task_id, name, completed, position, created_by, created_time, modified_by, modified_time, is_active)
				 VALUES (?,?,?,0,?,?,?,?,?,1)`,
				domain.GenID("s"), in.TaskID, name, i, cb, now, cb, now)
			if err != nil {
				return err
			}
		}

		if err := tx.GetContext(ctx, &task, `SELECT * FROM ms_task WHERE task_id = ?`, in.TaskID); err != nil {
			return err
		}
		return tx.SelectContext(ctx, &steps, `SELECT * FROM tr_task_step WHERE task_id = ? ORDER BY position ASC`, in.TaskID)
	})
	return task, steps, err
}

// Update applies a partial patch. Returns the updated task WITHOUT steps (the
// frontend manages steps separately via taskstep.* routes — parity with
// gas/Task.gs which returns Shape.task(updated, [])).
func (s *TaskStore) Update(ctx context.Context, id string, p TaskPatch, modifiedBy string) (Task, error) {
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
	if p.Status != nil {
		sets = append(sets, "status = ?")
		args = append(args, *p.Status)
	}
	if p.Source != nil {
		sets = append(sets, "source = ?")
		args = append(args, *p.Source)
	}
	if p.Difficulty != nil {
		sets = append(sets, "difficulty = ?")
		args = append(args, *p.Difficulty)
	}
	if p.Priority != nil {
		sets = append(sets, "priority = ?")
		args = append(args, *p.Priority)
	}
	if p.AssigneeChange {
		if p.AssigneeValue == "" {
			sets = append(sets, "assignee_id = NULL")
		} else {
			sets = append(sets, "assignee_id = ?")
			args = append(args, p.AssigneeValue)
		}
	}
	if p.DueChange {
		if p.DueValue == nil {
			sets = append(sets, "due_date = NULL")
		} else {
			sets = append(sets, "due_date = ?")
			args = append(args, *p.DueValue)
		}
	}
	if len(sets) == 0 {
		return s.GetByID(ctx, id)
	}
	sets = append(sets, "modified_by = ?", "modified_time = ?")
	args = append(args, nullStr(modifiedBy), time.Now().UTC(), id)
	q := "UPDATE ms_task SET " + strings.Join(sets, ", ") + " WHERE task_id = ?"
	if _, err := s.DB.ExecContext(ctx, q, args...); err != nil {
		return Task{}, err
	}
	return s.GetByID(ctx, id)
}

// Delete removes the task; tr_task_step and tr_comment cascade (FK ON DELETE CASCADE).
func (s *TaskStore) Delete(ctx context.Context, id string) error {
	_, err := s.DB.ExecContext(ctx, `DELETE FROM ms_task WHERE task_id = ?`, id)
	return err
}

// rowsUpdated returns the number of affected rows from a sql.Result, 0 on error.
func rowsUpdated(res sql.Result) int64 {
	n, err := res.RowsAffected()
	if err != nil {
		return 0
	}
	return n
}
