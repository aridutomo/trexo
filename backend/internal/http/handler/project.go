package handler

import (
	"net/http"

	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/aridutomo/trexo-backend/internal/http/respond"
	"github.com/aridutomo/trexo-backend/internal/store"
	"github.com/gin-gonic/gin"
)

func (h *API) ListProjects(c *gin.Context) {
	wid := c.Param("id")
	uid := userID(c)

	ok, err := domain.UserOwnsWorkspace(c.Request.Context(), h.S, wid, uid)
	if err != nil {
		respond.Error(c, err)
		return
	}
	if !ok {
		forbidden(c)
		return
	}
	ps, err := h.S.Project.ListByWorkspace(c.Request.Context(), wid)
	if err != nil {
		respond.Error(c, err)
		return
	}
	out := make([]domain.ProjectDTO, 0, len(ps))
	for _, p := range ps {
		out = append(out, p.ToDTO())
	}
	respond.OK(c, http.StatusOK, out)
}

func (h *API) CreateProject(c *gin.Context) {
	wid := c.Param("id")
	uid := userID(c)

	ok, err := domain.UserOwnsWorkspace(c.Request.Context(), h.S, wid, uid)
	if err != nil {
		respond.Error(c, err)
		return
	}
	if !ok {
		forbidden(c)
		return
	}

	var req struct {
		Name        string `json:"name" binding:"required,max=160"`
		Description string `json:"description"`
		Icon        string `json:"icon" binding:"omitempty,max=8"`
		Color       string `json:"color" binding:"omitempty,max=9"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err)
		return
	}
	p, err := h.S.Project.Create(c.Request.Context(), store.ProjectCreate{
		ProjectID:   domain.GenID("prj"),
		WorkspaceID: wid,
		Name:        req.Name,
		Description: req.Description, // "" default (parity with GAS)
		Icon:        defaultStr(req.Icon, "📁"),
		Color:       defaultStr(req.Color, "#2196f3"),
		CreatedBy:   uid,
	})
	if err != nil {
		respond.Error(c, err)
		return
	}
	respond.Created(c, p.ToDTO())
}

func (h *API) GetProject(c *gin.Context) {
	id := c.Param("id")
	if !h.canAccessProject(c, id) {
		return
	}
	p, err := h.S.Project.GetByID(c.Request.Context(), id)
	if err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, p.ToDTO())
}

func (h *API) UpdateProject(c *gin.Context) {
	id := c.Param("id")
	if !h.canAccessProject(c, id) {
		return
	}
	var req struct {
		Name        *string `json:"name" binding:"omitempty,max=160"`
		Description *string `json:"description"`
		Icon        *string `json:"icon" binding:"omitempty,max=8"`
		Color       *string `json:"color" binding:"omitempty,max=9"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err)
		return
	}
	p, err := h.S.Project.Update(c.Request.Context(), id, store.ProjectPatch{
		Name: req.Name, Description: req.Description, Icon: req.Icon, Color: req.Color,
	}, userID(c))
	if err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, p.ToDTO())
}

func (h *API) DeleteProject(c *gin.Context) {
	id := c.Param("id")
	if !h.canAccessProject(c, id) {
		return
	}
	// ms_task ON DELETE CASCADE removes tasks (+ steps, comments).
	if err := h.S.Project.Delete(c.Request.Context(), id); err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, domain.DeletedDTO{ID: id, Deleted: true})
}

// canAccessProject verifies the caller owns the project's workspace. It writes
// the error response (404 if missing, 403 if not owner) and returns false if the
// handler should abort.
func (h *API) canAccessProject(c *gin.Context, projectID string) bool {
	uid := userID(c)
	ctx := c.Request.Context()
	// existence first so a missing project is 404, not 403
	if _, err := h.S.Project.GetByID(ctx, projectID); err != nil {
		respond.Error(c, err)
		return false
	}
	ok, err := domain.UserCanAccessProject(ctx, h.S, projectID, uid)
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
