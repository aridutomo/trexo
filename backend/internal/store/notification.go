package store

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/jmoiron/sqlx"
)

// Ambang batas pengingat (keputusan produk):
//   - DueSoonWindow: task dengan due_date dalam X hari -> buat pengingat (info).
//   - WarningWindow: dalam X hari -> naik ke severity warning.
//   - SnoozeDuration: "close (X)" menyembunyikan selama ini, lalu muncul lagi.
const (
	DueSoonWindow  = 72 * time.Hour // 3 hari
	WarningWindow  = 24 * time.Hour // 1 hari  -> warning
	SnoozeDuration = 24 * time.Hour // close   -> muncul lagi 24 jam kemudian
)

type NotificationStore struct {
	DB *sqlx.DB
}

// dueTask is a qualifying task row selected by Generate. db tags are REQUIRED
// (snake_case column names won't match the lowercased Go field names sqlx uses
// by default), same as every other model in this package.
type dueTask struct {
	TaskID    string    `db:"task_id"`
	ProjectID string    `db:"project_id"`
	Name      string    `db:"name"`
	DueDate   time.Time `db:"due_date"`
}

// Generate membangun ulang pengingat user dari ms_task: upsert baris untuk task
// yang overdue / mendekati due_date, dan menonaktifkan (is_active=0) pengingat
// task yang sudah done / kehilangan due_date. Idempoten — aman dipanggil tiap
// request GET /notifications.
func (s *NotificationStore) Generate(ctx context.Context, userID string) error {
	// 1. ambil task yang qualified (assignee = user, belum done, due < now+3hari).
	threshold := time.Now().UTC().Add(DueSoonWindow)
	var due []dueTask
	err := s.DB.SelectContext(ctx, &due,
		`SELECT task_id AS task_id, project_id AS project_id, name AS name, due_date AS due_date
		   FROM ms_task
		  WHERE is_active = 1
		    AND assignee_id = ?
		    AND status <> ?
		    AND due_date IS NOT NULL
		    AND due_date < ?`,
		userID, domain.StatusDone, threshold)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	qualifying := make([]string, 0, len(due))

	// 2. upsert tiap task.
	for _, t := range due {
		qualifying = append(qualifying, t.TaskID)
		ntype, severity, title := classify(t.DueDate, now)

		if _, err := s.DB.ExecContext(ctx, `
			INSERT INTO ms_notification
			  (notification_id, user_id, type, severity, title, body, ref_type, ref_id,
			   project_id, due_at, target_url, is_read, read_at, is_dismissed, dismissed_until,
			   created_by, created_time, modified_by, modified_time, is_active)
			VALUES (?,?,?,?,?, ?, 'task', ?, ?, ?, ?, 0, NULL, 0, NULL, NULL, UTC_TIMESTAMP(3), NULL, UTC_TIMESTAMP(3), 1)
			ON DUPLICATE KEY UPDATE
			  type           = VALUES(type),
			  severity       = VALUES(severity),
			  title          = VALUES(title),
			  body           = VALUES(body),
			  project_id     = VALUES(project_id),
			  due_at         = VALUES(due_at),
			  target_url     = VALUES(target_url),
			  is_active      = 1,
			  modified_time  = UTC_TIMESTAMP(3),
			  -- snooze lewat & task belum done -> muncul LAGI + tandai belum dibaca
			  is_dismissed   = IF(dismissed_until IS NOT NULL AND dismissed_until < UTC_TIMESTAMP(3), 0, is_dismissed),
			  is_read        = IF(dismissed_until IS NOT NULL AND dismissed_until < UTC_TIMESTAMP(3), 0, is_read),
			  dismissed_until = IF(dismissed_until IS NOT NULL AND dismissed_until < UTC_TIMESTAMP(3), NULL, dismissed_until)`,
			domain.GenID("n"), userID, ntype, severity, title, t.Name,
			t.TaskID, t.ProjectID, t.DueDate, taskTargetURL(t.ProjectID, t.TaskID)); err != nil {
			return err
		}
	}

	// 3. nonaktifkan pengingat task yang tak lagi qualified (sudah done / due hilang
	//    / di-unassign / due > 3 hari). NOT IN dengan himpunan kosong = invalid SQL,
	//    jadi bercabang: kosong -> matikan semua pengingat task user tersebut.
	if len(qualifying) == 0 {
		_, err = s.DB.ExecContext(ctx,
			`UPDATE ms_notification SET is_active = 0, modified_time = UTC_TIMESTAMP(3)
			  WHERE user_id = ? AND ref_type = 'task' AND is_active = 1`, userID)
	} else {
		q, args, inErr := sqlx.In(`UPDATE ms_notification SET is_active = 0, modified_time = UTC_TIMESTAMP(3)
		       WHERE user_id = ? AND ref_type = 'task' AND is_active = 1
		         AND ref_id NOT IN (?)`, userID, qualifying)
		if inErr != nil {
			return inErr
		}
		// sqlx.In memperluas NOT IN (?) -> (?,?,?); rebind (?) untuk driver MySQL.
		_, err = s.DB.ExecContext(ctx, s.DB.Rebind(q), args...)
	}
	return err
}

// classify maps a due_date to (type, severity, title) relative to now.
//
//	overdue (due < now)            -> task_overdue, urgent
//	due <= now+1hari              -> task_due_soon, warning
//	sisanya (<=3 hari dari ambang) -> task_due_soon, info
func classify(due, now time.Time) (ntype, severity, title string) {
	if due.Before(now) {
		return domain.NtfTaskOverdue, domain.NtfSeverityUrgent, "Task Terlambat"
	}
	if due.Before(now.Add(WarningWindow)) {
		return domain.NtfTaskDueSoon, domain.NtfSeverityWarning, "Jatuh Tempo Segera"
	}
	return domain.NtfTaskDueSoon, domain.NtfSeverityInfo, "Mendekati Jatuh Tempo"
}

// taskTargetURL builds the frontend deep link for a task reminder.
func taskTargetURL(projectID, taskID string) string {
	return fmt.Sprintf("/app/tasks/%s", taskID)
}

// ListFilter controls ListForUser scoping. Empty ProjectID = lintas project
// (untuk dashboard). UnreadOnly = hanya yang belum dibaca (badge lonceng).
type ListFilter struct {
	ProjectID  string // optional
	UnreadOnly bool   // optional
}

func (s *NotificationStore) ListForUser(ctx context.Context, userID string, f ListFilter) ([]Notification, error) {
	var (
		conds = []string{"user_id = ?", "is_active = 1", "is_dismissed = 0"}
		args  = []any{userID}
	)
	if f.ProjectID != "" {
		conds = append(conds, "project_id = ?")
		args = append(args, f.ProjectID)
	}
	if f.UnreadOnly {
		conds = append(conds, "is_read = 0")
	}
	q := `SELECT * FROM ms_notification WHERE ` + strings.Join(conds, " AND ") +
		` ORDER BY FIELD(severity, 'urgent', 'warning', 'info'), due_at ASC, modified_time DESC`
	var ns []Notification
	err := s.DB.SelectContext(ctx, &ns, q, args...)
	return ns, err
}

// MarkRead menandai satu notifikasi sudah dibaca (hanya milik user tersebut).
// read_at diisi sekarang. Baris yang sudah non-aktif / di-snooze tidak diubah.
func (s *NotificationStore) MarkRead(ctx context.Context, userID, id string) error {
	res, err := s.DB.ExecContext(ctx,
		`UPDATE ms_notification SET is_read = 1, read_at = UTC_TIMESTAMP(3), modified_time = UTC_TIMESTAMP(3)
		  WHERE notification_id = ? AND user_id = ? AND is_active = 1`, id, userID)
	if err != nil {
		return err
	}
	if rowsUpdated(res) == 0 {
		return sql.ErrNoRows // -> 404
	}
	return nil
}

// MarkAllRead menandai semua pengingat aktif user sebagai sudah dibaca.
func (s *NotificationStore) MarkAllRead(ctx context.Context, userID string) error {
	_, err := s.DB.ExecContext(ctx,
		`UPDATE ms_notification SET is_read = 1, read_at = UTC_TIMESTAMP(3), modified_time = UTC_TIMESTAMP(3)
		  WHERE user_id = ? AND is_active = 1 AND is_read = 0`, userID)
	return err
}

// Dismiss menyembunyikan (snooze) satu notifikasi selama SnoozeDuration. Jika
// task belum done saat snooze lewat, generator akan memunculkannya lagi.
func (s *NotificationStore) Dismiss(ctx context.Context, userID, id string) error {
	res, err := s.DB.ExecContext(ctx,
		`UPDATE ms_notification
		    SET is_dismissed = 1, dismissed_until = ?, modified_time = UTC_TIMESTAMP(3)
		  WHERE notification_id = ? AND user_id = ? AND is_active = 1`,
		time.Now().UTC().Add(SnoozeDuration), id, userID)
	if err != nil {
		return err
	}
	if rowsUpdated(res) == 0 {
		return sql.ErrNoRows // -> 404
	}
	return nil
}
