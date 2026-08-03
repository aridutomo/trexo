// Code.gs — Web App entrypoints + request parsing.
//
// Contract (sent by src/lib/gas-client.ts in Next.js):
//   POST body : { key, token, action: "<entity>.<op>", payload: {...} }
//   GET query : ?key=..&token=..&action=<entity.op>&<filter fields as query params>
//
// GAS Web Apps do NOT expose custom HTTP headers, so the API key + session
// token travel in the body/query, not in headers.
//
// Response envelope:
//   success: { ok: true, data: <...> }
//   error:   { ok: false, error: { code, message } }   (HTTP-ish status carried
//            in the body; Apps Script always returns 200 at the transport layer)

function doGet(e) { return handle(e, "GET"); }
function doPost(e) { return handle(e, "POST"); }

function handle(e, method) {
  try {
    const req = parseRequest(e, method); // { key, token, action, payload }
    const authCtx = Auth.authorize(req); // { userId }  (throws on failure)
    const dispatchReq = Router.normalize(req);
    const data = Router.dispatch(dispatchReq, authCtx);
    return jsonOut({ ok: true, data: data });
  } catch (err) {
    return jsonOut(Errors.envelope(err));
  }
}

function parseRequest(e, method) {
  if (method === "GET") {
    const p = (e && e.parameter) || {};
    const payload = {};
    for (const k in p) {
      if (Object.prototype.hasOwnProperty.call(p, k) && k !== "key" && k !== "token" && k !== "action") {
        payload[k] = p[k];
      }
    }
    return { key: p.key || null, token: p.token || null, action: p.action || null, payload: payload };
  }
  const body = parseBody(e);
  return {
    key: body.key || null,
    token: body.token || null,
    action: body.action || null,
    payload: body.payload || {},
  };
}

function parseBody(e) {
  const contents = e && e.postData && e.postData.contents;
  if (!contents) return {};
  try {
    return JSON.parse(contents) || {};
  } catch (err) {
    return {};
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
