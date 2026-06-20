import { NextResponse } from "next/server";

/*
  ============================================================================
  /api/contact — STUB route handler (intentionally does NOT send email yet)
  ============================================================================

  This endpoint accepts the consultation / contact form payload, validates it
  lightly, logs it server-side, and returns 200 so the client can show its
  success state. It deliberately performs NO email delivery — there is no
  provider wired and no API key in the environment yet. We never claim a
  message was actually delivered to a human inbox.

  TODO(orchestrator): wire Resend/Formspree to clientservice@fortresstaxadvisors.com
    1. Add the provider SDK (e.g. `resend`) and a server-only API key
       (RESEND_API_KEY) to the deployment environment — do NOT prefix with
       NEXT_PUBLIC_ (see Next.js "preventing environment poisoning").
    2. In POST below, replace the console.info stub with the real send call,
       formatting `data` into the email body. Keep the validation + the
       graceful client mailto: fallback intact.
    3. Consider light anti-abuse (rate limit / honeypot / hCaptcha) before
       this is publicly reachable.

  Route handlers are not cached by default (Next 16), which is correct for a
  POST inbox. See node_modules/next/dist/docs/.../15-route-handlers.md.
  ============================================================================
*/

const CLIENT_SERVICE_EMAIL = "clientservice@fortresstaxadvisors.com";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  role?: unknown;
  organization?: unknown;
  entityType?: unknown;
  situation?: unknown;
  timeline?: unknown;
  heardFrom?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: Request) {
  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const name = asString(body.name);
  const email = asString(body.email);
  const situation = asString(body.situation);

  // Mirror the client validation server-side so a direct POST can't bypass it.
  if (!name || !email || !EMAIL_RE.test(email) || situation.length < 20) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid required fields." },
      { status: 422 }
    );
  }

  const inquiry = {
    receivedAt: new Date().toISOString(),
    name,
    email,
    phone: asString(body.phone),
    role: asString(body.role),
    organization: asString(body.organization),
    entityType: asString(body.entityType),
    timeline: asString(body.timeline),
    heardFrom: asString(body.heardFrom),
    situation,
  };

  // STUB: log only. Replace with real delivery — see TODO(orchestrator) above.
  console.info(
    `[contact] inquiry received (NOT YET EMAILED to ${CLIENT_SERVICE_EMAIL}):`,
    JSON.stringify(inquiry)
  );

  return NextResponse.json({ ok: true, delivered: false });
}

// Any other verb on this route is not allowed.
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed." },
    { status: 405 }
  );
}
