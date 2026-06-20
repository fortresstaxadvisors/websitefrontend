"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { KeystoneGlyph } from "@/components/brand/motifs";
import {
  TextField,
  SelectField,
  TextAreaField,
} from "@/components/firm-conversion/conversion-fields";

/*
  ConsultationForm — the consultative entry point. It does two jobs at once:
  it gathers the facts a Fortress advisor needs to prepare for a first
  conversation, AND it qualifies fit (entity type, situation, timeline, role).
  It is not a "get a quote" funnel.

  Submission is a deliberate STUB. The form POSTs JSON to /api/contact, which
  logs server-side and returns 200 but does NOT deliver email yet — see the
  TODO(orchestrator) in src/app/api/contact/route.ts. We never tell the user a
  message was "sent." On a server/network failure we degrade gracefully to a
  prefilled mailto: so the inquiry is never lost.

  TODO(orchestrator): wire Resend/Formspree to clientservice@fortresstaxadvisors.com
*/

const CLIENT_SERVICE_EMAIL = "clientservice@fortresstaxadvisors.com";

const ENTITY_OPTIONS = [
  { value: "individual", label: "Individual / household" },
  { value: "s-corp", label: "S corporation" },
  { value: "c-corp", label: "C corporation" },
  { value: "partnership-llc", label: "Partnership / LLC" },
  { value: "sole-proprietor", label: "Sole proprietorship" },
  { value: "trust-estate", label: "Trust or estate" },
  { value: "family-office", label: "Family office" },
  { value: "multiple", label: "Multiple entities" },
  { value: "not-sure", label: "Not sure yet" },
];

const TIMELINE_OPTIONS = [
  { value: "active", label: "Active — a decision or deadline is in front of us" },
  { value: "this-quarter", label: "This quarter" },
  { value: "this-year", label: "This tax year" },
  { value: "planning-ahead", label: "Planning ahead — no fixed deadline" },
  { value: "exploring", label: "Exploring options" },
];

const HEARD_OPTIONS = [
  { value: "referral", label: "Referral from an advisor or peer" },
  { value: "search", label: "Search" },
  { value: "insights", label: "A Fortress article or alert" },
  { value: "event", label: "An event or speaking engagement" },
  { value: "existing", label: "Existing relationship with Fortress" },
  { value: "other", label: "Other" },
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  role: string;
  organization: string;
  entityType: string;
  situation: string;
  timeline: string;
  heardFrom: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const INITIAL: FormState = {
  name: "",
  email: "",
  phone: "",
  role: "",
  organization: "",
  entityType: "",
  situation: "",
  timeline: "",
  heardFrom: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values: FormState): Errors {
  const e: Errors = {};
  if (!values.name.trim()) {
    e.name = "Please tell us your name.";
  } else if (values.name.trim().length < 2) {
    e.name = "Please enter your full name.";
  }
  if (!values.email.trim()) {
    e.email = "An email lets us reply.";
  } else if (!EMAIL_RE.test(values.email.trim())) {
    e.email = "Please check the email address.";
  }
  if (values.phone.trim() && values.phone.replace(/[^\d]/g, "").length < 7) {
    e.phone = "Please enter a reachable phone number, or leave this blank.";
  }
  if (!values.entityType) {
    e.entityType = "This helps us route your inquiry correctly.";
  }
  if (!values.situation.trim()) {
    e.situation = "A few sentences on the situation gets us to a useful first call.";
  } else if (values.situation.trim().length < 20) {
    e.situation = "A little more detail will make the first conversation sharper.";
  }
  if (!values.timeline) {
    e.timeline = "Let us know how time-sensitive this is.";
  }
  return e;
}

function buildMailto(values: FormState): string {
  const entity =
    ENTITY_OPTIONS.find((o) => o.value === values.entityType)?.label ?? "—";
  const timeline =
    TIMELINE_OPTIONS.find((o) => o.value === values.timeline)?.label ?? "—";
  const heard =
    HEARD_OPTIONS.find((o) => o.value === values.heardFrom)?.label ?? "—";
  const lines = [
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    values.phone ? `Phone: ${values.phone}` : null,
    values.role ? `Role / title: ${values.role}` : null,
    values.organization ? `Organization: ${values.organization}` : null,
    `Entity type: ${entity}`,
    `Timeline: ${timeline}`,
    `How they heard of Fortress: ${heard}`,
    "",
    "Situation / need:",
    values.situation,
  ].filter((l): l is string => l !== null);
  const subject = `Consultation inquiry — ${values.name}`;
  return `mailto:${CLIENT_SERVICE_EMAIL}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(lines.join("\n"))}`;
}

type Status = "idle" | "submitting" | "success" | "error";

export function ConsultationForm() {
  const baseId = useId();
  const fid = (k: string) => `${baseId}-${k}`;
  const [values, setValues] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>(
    {}
  );
  const [status, setStatus] = useState<Status>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const set = (key: keyof FormState) => (value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (touched[key]) {
      setErrors((prev) => {
        const next = validate({ ...values, [key]: value });
        return { ...prev, [key]: next[key] };
      });
    }
  };

  const blur = (key: keyof FormState) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: validate(values)[key] }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      role: true,
      organization: true,
      entityType: true,
      situation: true,
      timeline: true,
      heardFrom: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      // Move focus to the first field with an error for keyboard/SR users.
      const order: (keyof FormState)[] = [
        "name",
        "email",
        "phone",
        "role",
        "organization",
        "entityType",
        "situation",
        "timeline",
        "heardFrom",
      ];
      const firstBad = order.find((k) => nextErrors[k]);
      if (firstBad) {
        const el = formRef.current?.querySelector<HTMLElement>(`#${fid(firstBad)}`);
        el?.focus();
      }
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`Bad status ${res.status}`);
      setStatus("success");
      // Move focus to the confirmation so it's announced.
      window.setTimeout(() => successRef.current?.focus(), 50);
    } catch {
      // Graceful degradation: hand the inquiry to the user's mail client so
      // it is never silently lost while the delivery provider is unwired.
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className="panel relative overflow-hidden p-8 outline-none md:p-12"
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]">
          <KeystoneGlyph className="h-6 w-6 text-[var(--accent-ink)]" />
        </span>
        <h3 className="serif mt-6 t-h3 text-[var(--ink)]">
          Your note has reached us.
        </h3>
        <p className="lede mt-4 max-w-xl text-[var(--muted)]">
          Thank you, {values.name.split(" ")[0] || "and welcome"}. A Fortress
          advisor will review what you&rsquo;ve shared and respond{" "}
          <strong className="font-semibold text-[var(--ink)]">
            within one business day
          </strong>
          . If your matter is time-sensitive, note that in your reply and
          we&rsquo;ll prioritize accordingly.
        </p>
        <p className="mt-5 max-w-xl text-[0.92rem] leading-7 text-[var(--muted)]">
          What happens next: we read your situation before we respond, so the
          first conversation starts with substance rather than a script. We may
          ask one or two clarifying questions before suggesting the right next
          step.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/insights" variant="secondary" arrow>
            Read recent insights
          </Button>
          <Button href="/services" variant="ghost" arrow>
            Explore our services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={`${baseId}-formnote`}
      className="panel p-6 md:p-9"
    >
      <fieldset className="m-0 border-0 p-0" disabled={status === "submitting"}>
        <legend className="sr-only">Start a conversation with Fortress</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id={fid("name")}
            name="name"
            label="Full name"
            required
            autoComplete="name"
            value={values.name}
            onChange={set("name")}
            onBlur={blur("name")}
            error={touched.name ? errors.name : undefined}
          />
          <TextField
            id={fid("email")}
            name="email"
            type="email"
            inputMode="email"
            label="Email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={values.email}
            onChange={set("email")}
            onBlur={blur("email")}
            error={touched.email ? errors.email : undefined}
          />
          <TextField
            id={fid("phone")}
            name="phone"
            type="tel"
            inputMode="tel"
            label="Phone"
            autoComplete="tel"
            value={values.phone}
            onChange={set("phone")}
            onBlur={blur("phone")}
            error={touched.phone ? errors.phone : undefined}
          />
          <TextField
            id={fid("role")}
            name="role"
            label="Role or title"
            autoComplete="organization-title"
            placeholder="e.g. Owner, CFO, Trustee"
            value={values.role}
            onChange={set("role")}
            onBlur={blur("role")}
          />
          <TextField
            id={fid("organization")}
            name="organization"
            label="Organization"
            autoComplete="organization"
            className="sm:col-span-2"
            value={values.organization}
            onChange={set("organization")}
            onBlur={blur("organization")}
          />
          <SelectField
            id={fid("entityType")}
            name="entityType"
            label="Entity type"
            required
            hint="The structure most relevant to this matter."
            options={ENTITY_OPTIONS}
            value={values.entityType}
            onChange={set("entityType")}
            onBlur={blur("entityType")}
            error={touched.entityType ? errors.entityType : undefined}
          />
          <SelectField
            id={fid("timeline")}
            name="timeline"
            label="Timeline"
            required
            options={TIMELINE_OPTIONS}
            value={values.timeline}
            onChange={set("timeline")}
            onBlur={blur("timeline")}
            error={touched.timeline ? errors.timeline : undefined}
          />
          <TextAreaField
            id={fid("situation")}
            name="situation"
            label="The situation"
            required
            className="sm:col-span-2"
            rows={5}
            maxLength={2000}
            hint="What prompted you to reach out — the decision, the deadline, or the question on the table. A few sentences is plenty."
            value={values.situation}
            onChange={set("situation")}
            onBlur={blur("situation")}
            error={touched.situation ? errors.situation : undefined}
          />
          <SelectField
            id={fid("heardFrom")}
            name="heardFrom"
            label="How did you hear of Fortress?"
            className="sm:col-span-2"
            options={HEARD_OPTIONS}
            value={values.heardFrom}
            onChange={set("heardFrom")}
            onBlur={blur("heardFrom")}
          />
        </div>

        {status === "error" ? (
          <div
            role="alert"
            className="mt-7 rounded-[12px] border border-[var(--line-strong)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] p-5"
          >
            <p className="text-[0.92rem] font-semibold text-[var(--ink)]">
              We couldn&rsquo;t submit the form just now.
            </p>
            <p className="mt-1.5 text-[0.88rem] leading-7 text-[var(--muted)]">
              Nothing was lost. Send the same details straight to our client
              service team and we&rsquo;ll pick it up from there.
            </p>
            <a href={buildMailto(values)} className="btn btn-secondary mt-4">
              Email {CLIENT_SERVICE_EMAIL}
            </a>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-5 border-t border-[var(--line)] pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p
            id={`${baseId}-formnote`}
            className="max-w-md text-[0.82rem] leading-6 text-[var(--faint)]"
          >
            <span className="text-[var(--accent-ink)]" aria-hidden="true">
              *
            </span>{" "}
            Required. We reply within one business day. What you share is used
            only to prepare for our conversation.
          </p>
          <Button type="submit" arrow className="w-full shrink-0 sm:w-auto">
            {status === "submitting" ? "Sending…" : "Start the conversation"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
