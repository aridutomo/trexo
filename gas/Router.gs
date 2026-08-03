// Router.gs — parse + dispatch.
// Action format: "<entity>.<op>" e.g. "workspace.list", "task.move", "taskstep.toggle".

const Router = {
  normalize(req) {
    if (!req.action) throw Errors.validation("Missing 'action'.");
    const dot = String(req.action).split(".");
    if (dot.length !== 2 || !dot[0] || !dot[1]) {
      throw Errors.validation("Invalid action: " + req.action);
    }
    return { entity: dot[0], op: dot[1], payload: req.payload || {} };
  },

  dispatch(dispatchReq, authCtx) {
    const handlers = {
      workspace: Workspace,
      project: Project,
      task: Task,
      taskstep: TaskStep,
      comment: Comment,
    };
    const handler = handlers[dispatchReq.entity];
    if (!handler) throw Errors.validation("Unknown entity: " + dispatchReq.entity);
    const fn = handler[dispatchReq.op];
    if (typeof fn !== "function") {
      throw Errors.validation("Unknown op: " + dispatchReq.op + " on " + dispatchReq.entity);
    }
    return fn(dispatchReq.payload, authCtx);
  },
};
