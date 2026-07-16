import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getRuntimeSecrets } from "@/lib/runtime-secrets";

function same(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function middleware(request: NextRequest) {
  const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" };
  let expectedUser: string;
  let expectedPassword: string;
  try {
    const secrets = await getRuntimeSecrets();
    expectedUser = secrets.INVOICE_ADMIN_USERNAME;
    expectedPassword = secrets.INVOICE_ADMIN_PASSWORD;
  } catch {
    return new NextResponse("Invoice administration is not configured.", { status: 503, headers: privateHeaders });
  }
  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(header.slice(6), "base64").toString();
      const split = decoded.indexOf(":");
      if (split > 0 && same(decoded.slice(0, split), expectedUser) && same(decoded.slice(split + 1), expectedPassword)) {
        return NextResponse.next({ headers: privateHeaders });
      }
    } catch { /* prompt again */ }
  }
  return new NextResponse("Authentication required.", { status: 401, headers: { ...privateHeaders, "WWW-Authenticate": 'Basic realm="Fortress Invoice Console", charset="UTF-8"' } });
}

export const config = {
  matcher: ["/internal/invoices/:path*", "/api/internal/invoices/:path*", "/api/internal/engagements/:path*"],
  runtime: "nodejs",
};
