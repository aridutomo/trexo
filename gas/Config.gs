// Config.gs — reads secrets from Script Properties (set via Project Settings).
// NEVER hardcode keys here. Script Properties are server-side only and are
// not visible to callers.

const Config = {
  _cache: null,
  get() {
    if (this._cache) return this._cache;
    const props = PropertiesService.getScriptProperties();
    const apiKeys = (props.getProperty("GAS_API_KEYS") || "")
      .split(",")
      .map(function (k) { return k.trim(); })
      .filter(Boolean);
    this._cache = {
      supabaseUrl: (props.getProperty("SUPABASE_URL") || "").replace(/\/+$/, ""),
      serviceRoleKey: props.getProperty("SUPABASE_SERVICE_ROLE_KEY") || "",
      apiKeys: apiKeys,
    };
    return this._cache;
  },
};

function getCfg() {
  return Config.get();
}
