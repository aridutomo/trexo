// Errors.gs — unified typed errors + envelope.

const Errors = {
  make(code, message, status) {
    const e = new Error(message || code);
    e.code = code;
    e.status = status;
    return e;
  },
  unauth(message) { return this.make("UNAUTH", message || "Unauthorized", 401); },
  forbidden(message) { return this.make("FORBIDDEN", message || "Forbidden", 403); },
  notFound(message) { return this.make("NOT_FOUND", message || "Not found", 404); },
  validation(message) { return this.make("VALIDATION", message || "Validation error", 422); },
  upstream(message) { return this.make("UPSTREAM", message || "Upstream error", 502); },

  envelope(err) {
    return {
      ok: false,
      error: {
        code: (err && err.code) || "INTERNAL",
        message: (err && err.message) || "Internal error",
      },
    };
  },
  status(err) {
    return (err && err.status) || 500;
  },
};
