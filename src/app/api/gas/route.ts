import { callGas, GasApiError } from "@/lib/gas-client";
import type { NextRequest } from "next/server";

// Single authenticated proxy to the GAS backend. The browser uses the typed
// client in src/lib/api.ts, which POSTs { action, payload } here. This route
// resolves the caller's session (via callGas) and forwards to GAS.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    payload?: Record<string, unknown>;
  };

  if (!body.action) {
    return Response.json(
      { ok: false, error: { code: "VALIDATION", message: "Missing action." } },
      { status: 422 }
    );
  }

  try {
    const data = await callGas(body.action, body.payload || {});
    return Response.json({ ok: true, data });
  } catch (e) {
    if (e instanceof GasApiError) {
      return Response.json(
        { ok: false, error: { code: e.code, message: e.message } },
        { status: e.status }
      );
    }
    return Response.json(
      { ok: false, error: { code: "INTERNAL", message: "Internal error." } },
      { status: 500 }
    );
  }
}
