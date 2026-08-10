package handler

import (
	"net/http"

	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/aridutomo/trexo-backend/internal/http/respond"
	"github.com/aridutomo/trexo-backend/internal/store"
	"github.com/gin-gonic/gin"
)

// canAccessStep resolves the step's task and checks ownership. Writes 404/403.
func (h *API) canAccessStep(c *gin.Context, stepID string) (taskID string, ok bool) {
	uid := userID(c)
	ctx := c.Request.Context()
	tid, err := h.S.Step.StepTaskID(ctx, stepID)
	if err != nil {
		respond.Error(c, err) // ErrNoRows -> 404
		return "", false
	}
	allowed, err := domain.UserCanAccessTask(ctx, h.S, tid, uid)
	if err != nil {
		respond.Error(c, err)
		return "", false
	}
	if !allowed {
		forbidden(c)
		return "", false
	}
	return tid, true
}

func (h *API) CreateStep(c *gin.Context) {
	tid := c.Param("id")
	if !h.canAccessTask(c, tid) {
		return
	}
	var req struct {
		Name string `json:"name" binding:"required,max=200"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err)
		return
	}
	st, err := h.S.Step.Create(c.Request.Context(), store.StepCreate{
		StepID: domain.GenID("s"), TaskID: tid, Name: req.Name, CreatedBy: userID(c),
	})
	if err != nil {
		respond.Error(c, err)
		return
	}
	respond.Created(c, st.ToDTO())
}

func (h *API) UpdateStep(c *gin.Context) {
	id := c.Param("id")
	if _, ok := h.canAccessStep(c, id); !ok {
		return
	}
	var req struct {
		Name string `json:"name" binding:"required,max=200"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err)
		return
	}
	st, err := h.S.Step.UpdateName(c.Request.Context(), id, req.Name, userID(c))
	if err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, st.ToDTO())
}

func (h *API) ToggleStep(c *gin.Context) {
	id := c.Param("id")
	if _, ok := h.canAccessStep(c, id); !ok {
		return
	}
	st, err := h.S.Step.Toggle(c.Request.Context(), id, userID(c))
	if err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, st.ToDTO())
}

func (h *API) DeleteStep(c *gin.Context) {
	id := c.Param("id")
	if _, ok := h.canAccessStep(c, id); !ok {
		return
	}
	if err := h.S.Step.Delete(c.Request.Context(), id); err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, domain.DeletedDTO{ID: id, Deleted: true})
}

func (h *API) ReorderSteps(c *gin.Context) {
	tid := c.Param("id")
	if !h.canAccessTask(c, tid) {
		return
	}
	var req struct {
		StepIDs []string `json:"stepIds" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err)
		return
	}
	if err := h.S.Step.Reorder(c.Request.Context(), tid, req.StepIDs, userID(c)); err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, gin.H{"taskId": tid, "ordered": req.StepIDs})
}
