package handler

import (
	"net/http"

	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/aridutomo/trexo-backend/internal/http/respond"
	"github.com/aridutomo/trexo-backend/internal/store"
	"github.com/gin-gonic/gin"
)

// ListNotifications mengembalikan pengingat user yang aktif (belum di-snooze).
// Selalu memanggil Generate() lebih dulu agar daftar selalu segar saat login /
// buka dashboard. Query:
//
//	?projectId=<id>  -> filter per project (halaman project)
//	?unread=true     -> hanya yang belum dibaca (badge lonceng)
func (h *API) ListNotifications(c *gin.Context) {
	uid := userID(c)
	ctx := c.Request.Context()

	// Segarkan pengingat dari ms_task (idempoten, scoped ke user ini).
	if err := h.S.Notification.Generate(ctx, uid); err != nil {
		respond.Error(c, err)
		return
	}

	f := store.ListFilter{
		ProjectID:  c.Query("projectId"),
		UnreadOnly: c.Query("unread") == "true",
	}
	ns, err := h.S.Notification.ListForUser(ctx, uid, f)
	if err != nil {
		respond.Error(c, err)
		return
	}
	out := make([]domain.NotificationDTO, 0, len(ns))
	for _, n := range ns {
		out = append(out, n.ToDTO())
	}
	respond.OK(c, http.StatusOK, out)
}

// MarkRead menandai satu notifikasi sudah dibaca. Scoped ke user login.
func (h *API) MarkRead(c *gin.Context) {
	id := c.Param("id")
	if err := h.S.Notification.MarkRead(c.Request.Context(), userID(c), id); err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, gin.H{"id": id, "read": true})
}

// MarkAllRead menandai semua pengingat aktif user sebagai sudah dibaca.
func (h *API) MarkAllRead(c *gin.Context) {
	if err := h.S.Notification.MarkAllRead(c.Request.Context(), userID(c)); err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, gin.H{"read": true})
}

// Dismiss menyembunyikan (snooze 24 jam) satu notifikasi. Akan muncul lagi
// otomatis jika task belum selesai saat snooze berakhir.
func (h *API) DismissNotification(c *gin.Context) {
	id := c.Param("id")
	if err := h.S.Notification.Dismiss(c.Request.Context(), userID(c), id); err != nil {
		respond.Error(c, err)
		return
	}
	respond.OK(c, http.StatusOK, gin.H{"id": id, "dismissed": true})
}
