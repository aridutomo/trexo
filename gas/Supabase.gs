// Supabase.gs — thin REST helper over UrlFetchApp (the user's tested pattern).
// Uses the SERVICE ROLE key (bypasses RLS). Keep that key in Script Properties only.
// PostgREST conventions: ?<col>=eq.<val> , ?<col>=in.(a,b) , ?order=col.asc , arrays for bulk insert.

const Supabase = {
  /**
   * Low-level request. Returns parsed JSON (array for GET/PATCH, array or object otherwise).
   * Throws Errors.upstream on non-2xx.
   */
  request(method, path, query, body) {
    const cfg = getCfg();
    const url = cfg.supabaseUrl + "/rest/v1" + path + buildQuery(query);
    const headers = {
      apikey: cfg.serviceRoleKey,
      Authorization: "Bearer " + cfg.serviceRoleKey,
      "Content-Type": "application/json",
    };
    if (method !== "GET") headers["Prefer"] = "return=representation";

    const options = { method: method, headers: headers, muteHttpExceptions: true };
    if (body !== undefined && body !== null) options.payload = JSON.stringify(body);

    const res = UrlFetchApp.fetch(url, options);
    const code = res.getResponseCode();
    const text = res.getContentText();
    if (code >= 200 && code < 300) {
      if (!text) return method === "GET" ? [] : null;
      try {
        return JSON.parse(text);
      } catch (e) {
        return text;
      }
    }
    throw Errors.upstream("Supabase " + code + ": " + text);
  },

  list(path, query) {
    const rows = this.request("GET", path, query);
    return Array.isArray(rows) ? rows : [];
  },
  one(path, query) {
    const rows = this.list(path, query);
    return rows.length ? rows[0] : null;
  },
  insert(path, rows) {
    return this.request("POST", path, null, rows); // object OR array
  },
  insertOne(path, row) {
    const r = this.insert(path, row);
    return Array.isArray(r) && r.length ? r[0] : (r && !Array.isArray(r) ? r : null);
  },
  update(path, query, patch) {
    const r = this.request("PATCH", path, query, patch);
    return Array.isArray(r) ? r : (r ? [r] : []);
  },
  remove(path, query) {
    return this.request("DELETE", path, query);
  },
};

function buildQuery(query) {
  if (!query) return "";
  const parts = [];
  for (const k in query) {
    if (Object.prototype.hasOwnProperty.call(query, k) && query[k] !== undefined && query[k] !== null) {
      parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(query[k])));
    }
  }
  return parts.length ? "?" + parts.join("&") : "";
}
