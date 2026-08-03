// Auth.gs — identity bridge.
// 1) Validate the shared API key (the gate — who's allowed to call GAS at all).
// 2) Verify the better-auth session token against the `session` table via REST,
//    so GAS does NOT blindly trust a userId sent from Next.js. The token column
//    name is always `token`; userId/expiresAt are read defensively (camelCase
//    or snake_case) since better-auth's naming can vary.

const Auth = {
  authorize(req) {
    const cfg = getCfg();
    if (!cfg.apiKeys.length || cfg.apiKeys.indexOf(req.key) === -1) {
      throw Errors.unauth("Invalid API key.");
    }
    if (!req.token) throw Errors.unauth("Missing session token.");

    const row = Supabase.one("/session", { token: "eq." + req.token });
    if (!row) throw Errors.unauth("Invalid session.");

    const userId = row.userId || row.user_id;
    const expiresAt = row.expiresAt || row.expires_at;
    if (!userId) throw Errors.unauth("Invalid session.");
    if (expiresAt) {
      const exp = new Date(expiresAt).getTime();
      if (!isNaN(exp) && exp < Date.now()) throw Errors.unauth("Expired session.");
    }
    return { userId: String(userId) };
  },
};
