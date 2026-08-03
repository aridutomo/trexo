import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Server-only client that proxies business-data calls to the GAS Web App.
// The browser never calls GAS directly — it goes through /api/gas, which uses
// this module. GAS verifies the better-auth session token itself (it does not
// trust a userId from us), so we forward the real token.

export class GasApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function getSessionToken(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  const token = session?.session?.token;
  if (!token) throw new GasApiError("UNAUTH", "Unauthorized", 401);
  return token;
}

/**
 * Call a GAS action. Auth is resolved here from the current request's session.
 * Returns the `data` field of the GAS envelope, or throws GasApiError.
 */
export async function callGas<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const token = await getSessionToken();

  const res = await fetch(process.env.GAS_API_URL as string, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: process.env.GAS_API_KEY,
      token,
      action,
      payload,
    }),
    redirect: "follow", // GAS Web Apps 302-redirect to the final URL.
    cache: "no-store",
  });

  const json = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    data?: T;
    error?: { code?: string; message?: string };
  };

  if (!json.ok) {
    const code = json.error?.code || "UPSTREAM";
    throw new GasApiError(code, json.error?.message || "GAS request failed", mapStatus(code));
  }
  return json.data as T;
}

function mapStatus(code: string): number {
  switch (code) {
    case "UNAUTH":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "VALIDATION":
      return 422;
    default:
      return 502;
  }
}
