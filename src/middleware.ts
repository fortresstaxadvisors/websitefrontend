import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getRuntimeSecrets } from "@/lib/runtime-secrets";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const MAX_TRACKED_KEYS = 5_000;
const attempts = new Map<string, { failures: number; resetAt: number }>();

function same(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function response(status: number, body: string, extraHeaders: Record<string, string> = {}) {
  return new NextResponse(body, { status, headers: { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow", ...extraHeaders } });
}

function attemptKey(request: NextRequest) {
  // AWS appends the connection address to X-Forwarded-For. The final value is
  // therefore harder for a direct client to spoof than the first value.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return (forwarded || "unknown").slice(0, 128);
}

function prune(now: number) {
  if (attempts.size < MAX_TRACKED_KEYS) return;
  for (const [key, value] of attempts) {
    if (value.resetAt <= now) attempts.delete(key);
  }
  while (attempts.size >= MAX_TRACKED_KEYS) attempts.delete(attempts.keys().next().value!);
}

export async function middleware(request: NextRequest) {
  let expectedUser: string;
  let expectedPassword: string;
  try {
    const secrets = await getRuntimeSecrets();
    expectedUser = secrets.INVOICE_ADMIN_USERNAME;
    expectedPassword = secrets.INVOICE_ADMIN_PASSWORD;
  } catch {
    return response(503, "Invoice administration is not configured.");
  }
  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ") && header.length <= 4096) {
    try {
      const decoded = Buffer.from(header.slice(6), "base64").toString();
      const split = decoded.indexOf(":");
      const key = attemptKey(request);
      const now = Date.now();
      const attempt = attempts.get(key);
      if (attempt && attempt.resetAt > now && attempt.failures >= MAX_FAILURES) {
        return response(429, "Too many authentication attempts. Try again later.", { "Retry-After": String(Math.ceil((attempt.resetAt - now) / 1000)) });
      }
      if (split > 0 && same(decoded.slice(0, split), expectedUser) && same(decoded.slice(split + 1), expectedPassword)) {
        attempts.delete(key);
        const next = NextResponse.next();
        next.headers.set("Cache-Control", "private, no-store, max-age=0");
        next.headers.set("X-Robots-Tag", "noindex, nofollow");
        return next;
      }
      prune(now);
      attempts.set(key, { failures: (attempt?.resetAt || 0) > now ? attempt!.failures + 1 : 1, resetAt: (attempt?.resetAt || 0) > now ? attempt!.resetAt : now + WINDOW_MS });
    } catch { /* prompt again */ }
  }
  return response(401, "Authentication required.", { "WWW-Authenticate": 'Basic realm="Fortress Invoice Console", charset="UTF-8"' });
}

export const config = {
  matcher: ["/internal/invoices/:path*", "/api/internal/invoices/:path*", "/api/internal/engagements/:path*", "/api/internal/checks/:path*", "/api/internal/refunds/:path*", "/api/internal/operations/:path*"],
  runtime: "nodejs",
};
