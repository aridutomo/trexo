package handler

import (
	"net/http"

	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/aridutomo/trexo-backend/internal/http/respond"
	"github.com/aridutomo/trexo-backend/internal/store"
	"github.com/gin-gonic/gin"
)

func (h *API) ListComments(c *gin.Context) {
	tid := c.Param("id")
	if !h.canAccessTask(c, tid) {
		return
	}
	cs, err := h.S.Comment.ListByTask(c.Request.Context(), tid)
	if err != nil {
		respond.Error(c, err)
		return
	}
	out := make([]domain.CommentDTO, 0, len(cs))
	for _, cm := range cs {
		out = append(out, cm.ToDTO())
	}
	respond.OK(c, http.StatusOK, out)
}

func (h *API) CreateComment(c *gin.Context) {
	tid := c.Param("id")
	if !h.canAccessTask(c, tid) {
		return
	}
	uid := userID(c)
	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		badRequest(c, err)
		return
	}
	cm, err := h.S.Comment.Create(c.Request.Context(), store.CommentCreate{
		CommentID: domain.GenID("c"), TaskID: tid, UserID: uid, Content: req.Content, CreatedBy: uid,
	})
	if err != nil {
		respond.Error(c, err)
		return
	}
	respond.Created(c, cm.ToDTO())
}

// DeleteComment allows deletion by the comment author OR the workspace owner
// (anyone who can access the task). Mirrors gas/Comment.gs.
func (h *API) DeleteComment(c *gin.Context) {
	id := c.Param("id")
	uid := userID(c)
	ctx := c.Request.Context()

	author, taskID, err := h.S.Comment.CommentAuthorAndTask(ctx, id)
	if err != nil {
		respond.Error(c, err) // ErrNoRows -> 404
		return
	}
	if author != uid {
		ok, err := domain.UserCanAccessTask(ctx, h.S, taskID, uid)
		if err != nil {
			respond.Error(c, err)
			return
		}
		if !ok {
			forbidden(c)
			return
		}
	}
	if err := h.S.Comment.Delete(ctx, id); err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, domain.DeletedDTO{ID: id, Deleted: true})
}
