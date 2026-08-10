package handler

import (
	"net/http"

	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/aridutomo/trexo-backend/internal/http/respond"
	"github.com/aridutomo/trexo-backend/internal/store"
	"github.com/gin-gonic/gin"
)

func (h *API) ListWorkspaces(c *gin.Context) {
	ws, err := h.S.Workspace.ListByOwner(c.Request.Context(), userID(c))
	if err != nil {
		respond.Error(c, err)
		return
	}
	out := make([]domain.WorkspaceDTO, 0, len(ws))
	for _, w := range ws {
		out = append(out, w.ToDTO())
	}
	respond.OK(c, http.StatusOK, out)
}

func (h *API) CreateWorkspace(c *gin.Context) {
	var req struct {
		Name  string `json:"name" binding:"required,max=120"`
		Type  string `json:"type" binding:"required,oneof=personal company"`
		Color string `json:"color" binding:"required,max=9"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err)
		return
	}
	uid := userID(c)
	w, err := h.S.Workspace.Create(c.Request.Context(), store.WorkspaceCreate{
		WorkspaceID: domain.GenID("ws"),
		Name:        req.Name,
		Type:        req.Type,
		OwnerID:     uid,
		Color:       req.Color,
		CreatedBy:   uid,
	})
	if err != nil {
		respond.Error(c, err)
		return
	}
	respond.Created(c, w.ToDTO())
}

func (h *API) UpdateWorkspace(c *gin.Context) {
	id := c.Param("id")
	uid := userID(c)

	existing, err := h.S.Workspace.GetByID(c.Request.Context(), id)
	if err != nil {
		respond.Error(c, err) // ErrNoRows -> 404
		return
	}
	if existing.OwnerID != uid {
		forbidden(c)
		return
	}

	var req struct {
		Name  *string `json:"name" binding:"omitempty,max=120"`
		Type  *string `json:"type" binding:"omitempty,oneof=personal company"`
		Color *string `json:"color" binding:"omitempty,max=9"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err)
		return
	}
	w, err := h.S.Workspace.Update(c.Request.Context(), id, store.WorkspacePatch{
		Name: req.Name, Type: req.Type, Color: req.Color,
	}, uid)
	if err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, w.ToDTO())
}

func (h *API) DeleteWorkspace(c *gin.Context) {
	id := c.Param("id")
	uid := userID(c)

	existing, err := h.S.Workspace.GetByID(c.Request.Context(), id)
	if err != nil {
		respond.Error(c, err)
		return
	}
	if existing.OwnerID != uid {
		forbidden(c)
		return
	}

	// ms_project has ON DELETE RESTRICT; refuse if projects remain.
	n, err := h.S.Project.CountByWorkspace(c.Request.Context(), id)
	if err != nil {
		respond.Error(c, err)
		return
	}
	if n > 0 {
		respond.Error(c, domain.ErrValidation("Delete the projects in this workspace first."))
		return
	}

	if err := h.S.Workspace.Delete(c.Request.Context(), id); err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, domain.DeletedDTO{ID: id, Deleted: true})
}
