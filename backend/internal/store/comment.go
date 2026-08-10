package store

import (
	"context"
	"time"

	"github.com/jmoiron/sqlx"
)

type CommentStore struct {
	DB *sqlx.DB
}

type CommentCreate struct {
	CommentID string
	TaskID    string
	UserID    string
	Content   string
	CreatedBy string
}

func (s *CommentStore) ListByTask(ctx context.Context, taskID string) ([]Comment, error) {
	var cs []Comment
	err := s.DB.SelectContext(ctx, &cs,
		`SELECT * FROM tr_comment WHERE task_id = ? AND is_active = 1 ORDER BY created_time ASC`, taskID)
	return cs, err
}

func (s *CommentStore) GetByID(ctx context.Context, id string) (Comment, error) {
	var c Comment
	err := s.DB.GetContext(ctx, &c,
		`SELECT * FROM tr_comment WHERE comment_id = ? AND is_active = 1 LIMIT 1`, id)
	return c, err
}

// CommentAuthorAndTask returns the author user_id and owning task_id (for the
// delete authorization rule: author OR workspace owner).
func (s *CommentStore) CommentAuthorAndTask(ctx context.Context, id string) (userID, taskID string, err error) {
	var row struct {
		UserID string `db:"user_id"`
		TaskID string `db:"task_id"`
	}
	err = s.DB.GetContext(ctx, &row,
		`SELECT user_id, task_id FROM tr_comment WHERE comment_id = ? AND is_active = 1 LIMIT 1`, id)
	return row.UserID, row.TaskID, err
}

func (s *CommentStore) Create(ctx context.Context, in CommentCreate) (Comment, error) {
	now := time.Now().UTC()
	cb := nullStr(in.CreatedBy)
	_, err := s.DB.ExecContext(ctx,
		`INSERT INTO tr_comment
		   (comment_id, task_id, user_id, content, created_by, created_time, modified_by, modified_time, is_active)
		 VALUES (?,?,?,?,?,?,?,?,1)`,
		in.CommentID, in.TaskID, in.UserID, in.Content, cb, now, cb, now)
	if err != nil {
		return Comment{}, err
	}
	return s.GetByID(ctx, in.CommentID)
}

func (s *CommentStore) Delete(ctx context.Context, id string) error {
	_, err := s.DB.ExecContext(ctx, `DELETE FROM tr_comment WHERE comment_id = ?`, id)
	return err
}
