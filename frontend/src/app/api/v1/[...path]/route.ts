import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

// BFF (backend-for-frontend) proxy. The browser calls /api/v1/* on the Next.js
// origin; this handler resolves the better-auth session, then forwards the
// request to the Golang backend with an X-Session-Token header. Go verifies the
// token against the shared MySQL `session` table. Keeping the browser same-origin
// with Next.js means no CORS and the httpOnly session cookie stays secure.

const GO_API_URL = process.env.GO_API_URL as string;
const GO_API_KEY = process.env.GO_API_KEY;

function hasBody(method: string): boolean {
  return method === "POST" || method === "PATCH" || method === "PUT";
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, ctx);
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path } = await ctx.params;
  if (!GO_API_URL) {
    return Response.json(
      { error: { code: "INTERNAL", message: "GO_API_URL is not configured." } },
      { status: 500 },
    );
  }

  // Resolve the caller's session and extract the raw token (Go verifies it).
  const session = await auth.api.getSession({ headers: await headers() });
  const token = session?.session?.token;
  if (!token) {
    return Response.json(
      { error: { code: "UNAUTH", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const target = `${GO_API_URL}/api/v1/${(path ?? []).join("/")}${req.nextUrl.search}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "X-Session-Token": token,
      ...(GO_API_KEY ? { "X-Api-Key": GO_API_KEY } : {}),
    },
    cache: "no-store",
  };
  if (hasBody(req.method)) {
    init.body = await req.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return Response.json(
      { error: { code: "UPSTREAM", message: "Backend unreachable." } },
      { status: 502 },
    );
  }

  // Pipe the Go response (status + JSON) straight through to the browser.
  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
