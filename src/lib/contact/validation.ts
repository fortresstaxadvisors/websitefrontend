import {
  ENTITY_OPTIONS,
  HEARD_OPTIONS,
  TIMELINE_OPTIONS,
  type EntityType,
  type HeardFrom,
  type Timeline,
} from "@/lib/contact/options";

export const MAX_CONTACT_BODY_BYTES = 12_000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENTITY_VALUES = new Set<string>(ENTITY_OPTIONS.map(({ value }) => value));
const TIMELINE_VALUES = new Set<string>(TIMELINE_OPTIONS.map(({ value }) => value));
const HEARD_VALUES = new Set<string>(HEARD_OPTIONS.map(({ value }) => value));

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
  website?: unknown;
  turnstileToken?: unknown;
  submissionId?: unknown;
};

export type ContactInquiry = {
  submissionId: string;
  receivedAt: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  organization: string;
  entityType: EntityType;
  situation: string;
  timeline: Timeline;
  heardFrom: HeardFrom | "";
  turnstileToken: string;
};

type ValidationResult =
  | { ok: true; inquiry: ContactInquiry }
  | { ok: false; error: string; honeypot: boolean };

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isSingleLine(value: string) {
  return !/[\r\n\u2028\u2029]/.test(value);
}

function validOptionalLine(value: string, max: number) {
  return value.length <= max && isSingleLine(value);
}

export function validateContactPayload(payload: unknown): ValidationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "Invalid request body.", honeypot: false };
  }

  const body = payload as ContactPayload;
  const website = readString(body.website);
  if (website) {
    return { ok: false, error: "Unable to accept this request.", honeypot: true };
  }

  const name = readString(body.name);
  const email = readString(body.email);
  const phone = readString(body.phone);
  const role = readString(body.role);
  const organization = readString(body.organization);
  const entityType = readString(body.entityType);
  const situation = readString(body.situation);
  const timeline = readString(body.timeline);
  const heardFrom = readString(body.heardFrom);
  const turnstileToken = readString(body.turnstileToken);
  const submissionId = readString(body.submissionId);

  const valid =
    name.length >= 2 &&
    name.length <= 120 &&
    isSingleLine(name) &&
    email.length <= 254 &&
    isSingleLine(email) &&
    EMAIL_RE.test(email) &&
    validOptionalLine(phone, 40) &&
    (!phone || phone.replace(/[^\d]/g, "").length >= 7) &&
    validOptionalLine(role, 120) &&
    validOptionalLine(organization, 160) &&
    ENTITY_VALUES.has(entityType) &&
    situation.length >= 20 &&
    situation.length <= 2_000 &&
    TIMELINE_VALUES.has(timeline) &&
    (!heardFrom || HEARD_VALUES.has(heardFrom)) &&
    turnstileToken.length <= 2_048 &&
    UUID_V4_RE.test(submissionId);

  if (!valid) {
    return {
      ok: false,
      error: "Missing or invalid required fields.",
      honeypot: false,
    };
  }

  return {
    ok: true,
    inquiry: {
      submissionId,
      receivedAt: new Date().toISOString(),
      name,
      email,
      phone,
      role,
      organization,
      entityType: entityType as EntityType,
      situation,
      timeline: timeline as Timeline,
      heardFrom: heardFrom as HeardFrom | "",
      turnstileToken,
    },
  };
}
