package handler

import (
	"fmt"
	"net/http"

	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/aridutomo/trexo-backend/internal/http/respond"
	"github.com/aridutomo/trexo-backend/internal/store"
	"github.com/gin-gonic/gin"
)

func (h *API) ListTasks(c *gin.Context) {
	pid := c.Param("id")
	if !h.canAccessProject(c, pid) {
		return
	}
	tasks, err := h.S.Task.ListByProject(c.Request.Context(), pid)
	if err != nil {
		respond.Error(c, err)
		return
	}
	out := make([]domain.TaskDTO, 0, len(tasks))
	if len(tasks) == 0 {
		respond.OK(c, http.StatusOK, out)
		return
	}
	ids := make([]string, len(tasks))
	for i, t := range tasks {
		ids[i] = t.TaskID
	}
	stepsByTask, err := h.S.Step.ListByTaskIDs(c.Request.Context(), ids)
	if err != nil {
		respond.Error(c, err)
		return
	}
	for _, t := range tasks {
		out = append(out, t.ToDTO(stepsByTask[t.TaskID]))
	}
	respond.OK(c, http.StatusOK, out)
}

func (h *API) GetTask(c *gin.Context) {
	id := c.Param("id")
	if !h.canAccessTask(c, id) {
		return
	}
	t, err := h.S.Task.GetByID(c.Request.Context(), id)
	if err != nil {
		respond.Error(c, err)
		return
	}
	steps, err := h.S.Step.ListByTask(c.Request.Context(), id)
	if err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, t.ToDTO(steps))
}

func (h *API) CreateTask(c *gin.Context) {
	pid := c.Param("id")
	if !h.canAccessProject(c, pid) {
		return
	}
	uid := userID(c)

	var req struct {
		Name        string   `json:"name" binding:"required,max=200"`
		Description string   `json:"description"`
		Status      string   `json:"status" binding:"omitempty,oneof=todo in_progress review done"`
		Source      string   `json:"source" binding:"required,oneof=own_idea user_request"`
		Difficulty  string   `json:"difficulty" binding:"required,oneof=easy medium hard"`
		Priority    string   `json:"priority" binding:"omitempty,oneof=low medium high urgent"`
		AssigneeID  string   `json:"assigneeId,omitempty"`
		DueDate     string   `json:"dueDate,omitempty"`
		Steps       []string `json:"steps,omitempty" binding:"omitempty,dive,max=200"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err)
		return
	}

	status := req.Status
	if status == "" {
		status = domain.StatusTodo
	}
	priority := req.Priority
	if priority == "" {
		priority = domain.PriorityMedium
	}
	// GAS: assignee_id = payload.assigneeId || ctx.userId; due_date = payload.dueDate || null
	assignee := req.AssigneeID
	if assignee == "" {
		assignee = uid
	}
	due, err := parseISO(req.DueDate)
	if err != nil {
		badRequest(c, err)
		return
	}

	task, steps, err := h.S.Task.CreateWithSteps(c.Request.Context(), store.TaskCreate{
		TaskID:      domain.GenID("t"),
		ProjectID:   pid,
		Name:        req.Name,
		Description: req.Description,
		Status:      status,
		Source:      req.Source,
		Difficulty:  req.Difficulty,
		Priority:    priority,
		AssigneeID:  assignee,
		DueDate:     due,
		StepNames:   req.Steps,
		CreatedBy:   uid,
	})
	if err != nil {
		respond.Error(c, err)
		return
	}
	respond.Created(c, task.ToDTO(steps))
}

// UpdateTask applies a partial patch. Uses a map so assigneeId/dueDate can be
// explicitly cleared to null (distinguished from "not sent" — parity with
// gas/Task.gs `payload.assigneeId !== undefined`).
func (h *API) UpdateTask(c *gin.Context) {
	id := c.Param("id")
	if !h.canAccessTask(c, id) {
		return
	}

	var body map[string]any
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err)
		return
	}

	p := store.TaskPatch{}
	if v, ok := body["name"]; ok {
		s, _ := v.(string)
		p.Name = &s
	}
	if v, ok := body["description"]; ok {
		s, _ := v.(string)
		p.Description = &s
	}
	if v, ok := body["status"]; ok {
		s, _ := v.(string)
		if s != "" && !domain.IsValidStatus(s) {
			badRequest(c, fmt.Errorf("invalid status %q", s))
			return
		}
		p.Status = &s
	}
	if v, ok := body["source"]; ok {
		s, _ := v.(string)
		if s != "" && !domain.IsValidSource(s) {
			badRequest(c, fmt.Errorf("invalid source %q", s))
			return
		}
		p.Source = &s
	}
	if v, ok := body["difficulty"]; ok {
		s, _ := v.(string)
		if s != "" && !domain.IsValidDifficulty(s) {
			badRequest(c, fmt.Errorf("invalid difficulty %q", s))
			return
		}
		p.Difficulty = &s
	}
	if v, ok := body["priority"]; ok {
		s, _ := v.(string)
		if s != "" && !domain.IsValidPriority(s) {
			badRequest(c, fmt.Errorf("invalid priority %q", s))
			return
		}
		p.Priority = &s
	}
	if v, ok := body["assigneeId"]; ok {
		p.AssigneeChange = true
		if v == nil {
			p.AssigneeValue = "" // clear to NULL
		} else {
			s, _ := v.(string)
			p.AssigneeValue = s
		}
	}
	if v, ok := body["dueDate"]; ok {
		p.DueChange = true
		if v == nil {
			p.DueValue = nil // clear to NULL
		} else {
			s, _ := v.(string)
			tt, err := parseISO(s)
			if err != nil {
				badRequest(c, err)
				return
			}
			p.DueValue = tt
		}
	}

	updated, err := h.S.Task.Update(c.Request.Context(), id, p, userID(c))
	if err != nil {
		respond.Error(c, err)
		return
	}
	// steps:[] on update — the frontend manages steps via taskstep.* routes.
	respond.OK(c, http.StatusOK, updated.ToDTO(nil))
}

func (h *API) DeleteTask(c *gin.Context) {
	id := c.Param("id")
	if !h.canAccessTask(c, id) {
		return
	}
	// tr_task_step + tr_comment cascade on task delete.
	if err := h.S.Task.Delete(c.Request.Context(), id); err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, domain.DeletedDTO{ID: id, Deleted: true})
}

// canAccessTask verifies the caller owns the task's project workspace. Writes
// 404 (missing) or 403 (not owner) and returns false if the handler should abort.
func (h *API) canAccessTask(c *gin.Context, taskID string) bool {
	uid := userID(c)
	ctx := c.Request.Context()
	if _, err := h.S.Task.GetByIDAny(ctx, taskID); err != nil {
		respond.Error(c, err)
		return false
	}
	ok, err := domain.UserCanAccessTask(ctx, h.S, taskID, uid)
	if err != nil {
		respond.Error(c, err)
		return false
	}
	if !ok {
		forbidden(c)
		return false
	}
	return true
}
