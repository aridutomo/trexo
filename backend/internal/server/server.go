// Package server wires the gin router: global middleware, health check, and the
// authenticated /api/v1 route group.
package server

import (
	"net/http"

	"github.com/aridutomo/trexo-backend/internal/auth"
	"github.com/aridutomo/trexo-backend/internal/config"
	"github.com/aridutomo/trexo-backend/internal/domain"
	"github.com/aridutomo/trexo-backend/internal/http/handler"
	"github.com/aridutomo/trexo-backend/internal/http/middleware"
	"github.com/aridutomo/trexo-backend/internal/http/respond"
	"github.com/aridutomo/trexo-backend/internal/store"
	"github.com/gin-gonic/gin"
)

// NewRouter builds the application router. Path params use :id consistently
// (gin forbids conflicting wildcard names at the same path position, so nested
// routes like /tasks/:id/steps reuse :id rather than :tid).
func NewRouter(s *store.Stores, cfg *config.Config) *gin.Engine {
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(middleware.Recover())
	r.Use(middleware.RequestID())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS(cfg.AllowedOrigins, cfg.IsProduction()))

	r.GET("/healthz", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })

	verifier := &auth.Verifier{DB: s.DB}
	api := handler.New(s)

	v1 := r.Group("/api/v1")
	v1.Use(middleware.APIKey(cfg.BFFAPIKeys)) // defense in depth (no-op if BFF_API_KEYS unset)
	v1.Use(auth.Middleware(verifier))
	{
		// Workspaces
		v1.GET("/workspaces", api.ListWorkspaces)
		v1.POST("/workspaces", api.CreateWorkspace)
		v1.PATCH("/workspaces/:id", api.UpdateWorkspace)
		v1.DELETE("/workspaces/:id", api.DeleteWorkspace)

		// Projects
		v1.GET("/workspaces/:id/projects", api.ListProjects)
		v1.POST("/workspaces/:id/projects", api.CreateProject)
		v1.GET("/projects/:id", api.GetProject)
		v1.PATCH("/projects/:id", api.UpdateProject)
		v1.DELETE("/projects/:id", api.DeleteProject)

		// Tasks
		v1.GET("/projects/:id/tasks", api.ListTasks)
		v1.POST("/projects/:id/tasks", api.CreateTask)
		v1.GET("/tasks/:id", api.GetTask)
		v1.PATCH("/tasks/:id", api.UpdateTask)
		v1.DELETE("/tasks/:id", api.DeleteTask)

		// Steps
		v1.POST("/tasks/:id/steps", api.CreateStep)
		v1.PATCH("/steps/:id", api.UpdateStep)
		v1.PATCH("/steps/:id/toggle", api.ToggleStep)
		v1.DELETE("/steps/:id", api.DeleteStep)
		v1.PUT("/tasks/:id/steps/reorder", api.ReorderSteps)

		// Comments
		v1.GET("/tasks/:id/comments", api.ListComments)
		v1.POST("/tasks/:id/comments", api.CreateComment)
		v1.DELETE("/comments/:id", api.DeleteComment)

		// Notifications (pengingat task overdue / mendekati jatuh tempo).
		//   GET    /notifications?projectId=&unread=true
		//   POST   /notifications/read-all
		//   POST   /notifications/:id/read
		//   POST   /notifications/:id/dismiss
		v1.GET("/notifications", api.ListNotifications)
		v1.POST("/notifications/read-all", api.MarkAllRead)
		v1.POST("/notifications/:id/read", api.MarkRead)
		v1.POST("/notifications/:id/dismiss", api.DismissNotification)
	}

	r.NoRoute(func(c *gin.Context) { respond.Error(c, domain.ErrNotFound("Route not found.")) })
	r.NoMethod(func(c *gin.Context) { respond.Error(c, domain.ErrValidation("Method not allowed.")) })
	return r
}
