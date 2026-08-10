package store

import (
	"context"
	"database/sql"

	"github.com/jmoiron/sqlx"
)

// Stores is the single dependency handed to HTTP handlers. It holds the pool and
// one store per entity. It also implements domain.AuthzReader (see authz.go).
type Stores struct {
	DB        *sqlx.DB
	Workspace *WorkspaceStore
	Project   *ProjectStore
	Task      *TaskStore
	Step      *StepStore
	Comment   *CommentStore
}

func NewStores(db *sqlx.DB) *Stores {
	return &Stores{
		DB:        db,
		Workspace: &WorkspaceStore{DB: db},
		Project:   &ProjectStore{DB: db},
		Task:      &TaskStore{DB: db},
		Step:      &StepStore{DB: db},
		Comment:   &CommentStore{DB: db},
	}
}

// runTx runs fn inside a transaction on db, committing on nil error and rolling
// back otherwise (including panics). Used by task.create (task + steps) and
// step.reorder so partial writes never persist.
func runTx(ctx context.Context, db *sqlx.DB, fn func(*sqlx.Tx) error) (err error) {
	tx, err := db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
		if err != nil {
			_ = tx.Rollback()
			return
		}
		err = tx.Commit()
	}()
	return fn(tx)
}

// nullStr returns a sql.NullString that is invalid for the empty string.
func nullStr(v string) sql.NullString {
	return sql.NullString{String: v, Valid: v != ""}
}
