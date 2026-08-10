package store

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/jmoiron/sqlx"
)

type StepStore struct {
	DB *sqlx.DB
}

type StepCreate struct {
	StepID    string
	TaskID    string
	Name      string
	CreatedBy string
}

func (s *StepStore) ListByTask(ctx context.Context, taskID string) ([]Step, error) {
	var ss []Step
	err := s.DB.SelectContext(ctx, &ss,
		`SELECT * FROM tr_task_step WHERE task_id = ? AND is_active = 1 ORDER BY position ASC`, taskID)
	return ss, err
}

// ListByTaskIDs fetches steps for many tasks in one query, grouped by task_id.
// Used by task.list (mirrors gas/Task.gs bulk step fetch). Empty input → empty map.
func (s *StepStore) ListByTaskIDs(ctx context.Context, taskIDs []string) (map[string][]Step, error) {
	out := map[string][]Step{}
	if len(taskIDs) == 0 {
		return out, nil
	}
	query, args, err := sqlx.In(
		`SELECT * FROM tr_task_step WHERE task_id IN (?) AND is_active = 1 ORDER BY position ASC`, taskIDs)
	if err != nil {
		return nil, err
	}
	var rows []Step
	if err := s.DB.SelectContext(ctx, &rows, query, args...); err != nil {
		return nil, err
	}
	for _, r := range rows {
		out[r.TaskID] = append(out[r.TaskID], r)
	}
	return out, nil
}

func (s *StepStore) GetByID(ctx context.Context, id string) (Step, error) {
	var st Step
	err := s.DB.GetContext(ctx, &st,
		`SELECT * FROM tr_task_step WHERE step_id = ? LIMIT 1`, id)
	return st, err
}

// StepTaskID resolves the owning task_id of a step (for authorization).
func (s *StepStore) StepTaskID(ctx context.Context, id string) (string, error) {
	var tid string
	err := s.DB.GetContext(ctx, &tid, `SELECT task_id FROM tr_task_step WHERE step_id = ? LIMIT 1`, id)
	return tid, err
}

func (s *StepStore) Create(ctx context.Context, in StepCreate) (Step, error) {
	var pos int
	if err := s.DB.GetContext(ctx, &pos,
		`SELECT COUNT(*) FROM tr_task_step WHERE task_id = ? AND is_active = 1`, in.TaskID); err != nil {
		return Step{}, err
	}
	now := time.Now().UTC()
	cb := nullStr(in.CreatedBy)
	res, err := s.DB.ExecContext(ctx,
		`INSERT INTO tr_task_step
		   (step_id, task_id, name, completed, position, created_by, created_time, modified_by, modified_time, is_active)
		 VALUES (?,?,?,0,?,?,?,?,?,1)`,
		in.StepID, in.TaskID, in.Name, pos, cb, now, cb, now)
	if err != nil {
		return Step{}, err
	}
	if rowsUpdated(res) == 0 {
		return Step{}, sql.ErrNoRows
	}
	return s.GetByID(ctx, in.StepID)
}

func (s *StepStore) UpdateName(ctx context.Context, id, name, modifiedBy string) (Step, error) {
	now := time.Now().UTC()
	res, err := s.DB.ExecContext(ctx,
		`UPDATE tr_task_step SET name = ?, modified_by = ?, modified_time = ? WHERE step_id = ? AND is_active = 1`,
		name, nullStr(modifiedBy), now, id)
	if err != nil {
		return Step{}, err
	}
	if rowsUpdated(res) == 0 {
		return Step{}, sql.ErrNoRows
	}
	return s.GetByID(ctx, id)
}

// Toggle flips completed. Returns sql.ErrNoRows if the step is missing/inactive.
func (s *StepStore) Toggle(ctx context.Context, id, modifiedBy string) (Step, error) {
	now := time.Now().UTC()
	res, err := s.DB.ExecContext(ctx,
		`UPDATE tr_task_step SET completed = NOT completed, modified_by = ?, modified_time = ? WHERE step_id = ? AND is_active = 1`,
		nullStr(modifiedBy), now, id)
	if err != nil {
		return Step{}, err
	}
	if rowsUpdated(res) == 0 {
		return Step{}, sql.ErrNoRows
	}
	return s.GetByID(ctx, id)
}

func (s *StepStore) Delete(ctx context.Context, id string) error {
	_, err := s.DB.ExecContext(ctx, `DELETE FROM tr_task_step WHERE step_id = ?`, id)
	return err
}

// Reorder repositions steps by stepIds order (index = new position). One
// transaction with a single CASE UPDATE — atomic and fast. All stepIds must
// belong to taskID and be active, else FORBIDDEN (mirrors gas/TaskStep.gs).
func (s *StepStore) Reorder(ctx context.Context, taskID string, stepIDs []string, modifiedBy string) error {
	return runTx(ctx, s.DB, func(tx *sqlx.Tx) error {
		// Authorize: every requested id must be an active step of this task.
		chkQuery, chkArgs, err := sqlx.In(
			`SELECT COUNT(*) FROM tr_task_step WHERE task_id = ? AND step_id IN (?) AND is_active = 1`,
			taskID, stepIDs)
		if err != nil {
			return err
		}
		var owned int
		if err := tx.GetContext(ctx, &owned, chkQuery, chkArgs...); err != nil {
			return err
		}
		if owned != len(stepIDs) {
			return domain.ErrForbidden("step list mismatch")
		}

		var b strings.Builder
		b.WriteString("UPDATE tr_task_step SET position = CASE step_id")
		args := []any{}
		for i, sid := range stepIDs {
			b.WriteString(" WHEN ? THEN ?")
			args = append(args, sid, i)
		}
		b.WriteString(" END, modified_by = ?, modified_time = ? WHERE task_id = ? AND step_id IN (?)")
		args = append(args, nullStr(modifiedBy), time.Now().UTC(), taskID)
		args = append(args, any(stepIDs)) // sqlx.In expands this trailing IN (?)

		q, expanded, err := sqlx.In(b.String(), args...)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, q, expanded...)
		return err
	})
}
