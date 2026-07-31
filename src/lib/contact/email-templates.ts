import {
  ENTITY_OPTIONS,
  HEARD_OPTIONS,
  TIMELINE_OPTIONS,
  optionLabel,
} from "@/lib/contact/options";
import type { ContactInquiry } from "@/lib/contact/validation";

export type ContactEmail = {
  from: string;
  to: string[];
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  tags: { name: string; value: string }[];
};

const SITE_URL = "https://fortresstaxadvisors.com";
const SLATE = "#11181f";
const INK = "#1d2936";
const MUTED = "#55615e";
const BRASS = "#b99760";
const BRASS_BRIGHT = "#d0b078";
const IVORY = "#f4efe7";
const SURFACE = "#fffdf9";
const LINE = "#d8d0c3";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function firstName(name: string) {
  return name.split(/\s+/)[0] || "there";
}

function formatReceivedAt(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  }).format(new Date(iso));
}

function emailShell({
  preheader,
  eyebrow,
  title,
  body,
}: {
  preheader: string;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${IVORY};color:${INK};font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${IVORY};">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:${SURFACE};border:1px solid ${LINE};">
            <tr>
              <td style="background:${SLATE};padding:26px 30px;border-bottom:3px solid ${BRASS};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="52" valign="middle">
                      <img src="${SITE_URL}/fortress-email-mark.png" width="40" height="40" alt="Fortress" style="display:block;width:40px;height:40px;border:0;">
                    </td>
                    <td valign="middle">
                      <div style="color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:26px;letter-spacing:.2px;">Fortress Tax Advisors</div>
                      <div style="margin-top:3px;color:${BRASS_BRIGHT};font-size:10px;line-height:15px;font-weight:bold;text-transform:uppercase;letter-spacing:2.1px;">Built to hold</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:42px 38px 38px;">
                <div style="color:#6e5226;font-size:11px;line-height:17px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;">${escapeHtml(eyebrow)}</div>
                <h1 style="margin:12px 0 22px;color:${INK};font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:39px;font-weight:normal;">${escapeHtml(title)}</h1>
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 38px;background:#f8f4ed;border-top:1px solid ${LINE};">
                <p style="margin:0;color:${MUTED};font-size:12px;line-height:19px;">
                  Fortress Tax Advisors &nbsp;•&nbsp;
                  <a href="${SITE_URL}" style="color:#6e5226;text-decoration:underline;">fortresstaxadvisors.com</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function detailRow(label: string, value: string) {
  if (!value) return "";
  return `<tr>
    <td valign="top" style="width:150px;padding:10px 16px 10px 0;border-bottom:1px solid ${LINE};color:${MUTED};font-size:12px;line-height:19px;font-weight:bold;text-transform:uppercase;letter-spacing:.7px;">${escapeHtml(label)}</td>
    <td valign="top" style="padding:10px 0;border-bottom:1px solid ${LINE};color:${INK};font-size:14px;line-height:22px;">${escapeHtml(value).replaceAll("\n", "<br>")}</td>
  </tr>`;
}

function buildInternalEmail(
  inquiry: ContactInquiry,
  from: string,
  to: string
): ContactEmail {
  const entity = optionLabel(ENTITY_OPTIONS, inquiry.entityType);
  const timeline = optionLabel(TIMELINE_OPTIONS, inquiry.timeline);
  const heard = inquiry.heardFrom
    ? optionLabel(HEARD_OPTIONS, inquiry.heardFrom)
    : "Not provided";
  const receivedAt = formatReceivedAt(inquiry.receivedAt);

  const rows = [
    detailRow("Name", inquiry.name),
    detailRow("Email", inquiry.email),
    detailRow("Phone", inquiry.phone),
    detailRow("Role / title", inquiry.role),
    detailRow("Organization", inquiry.organization),
    detailRow("Entity type", entity),
    detailRow("Timeline", timeline),
    detailRow("How they found us", heard),
    detailRow("Situation", inquiry.situation),
    detailRow("Received", receivedAt),
    detailRow("Submission ID", inquiry.submissionId),
  ].join("");

  const html = emailShell({
    preheader: `${inquiry.name} submitted a consultation inquiry.`,
    eyebrow: "New consultation inquiry",
    title: inquiry.name,
    body: `
      <p style="margin:0 0 24px;color:${MUTED};font-size:15px;line-height:25px;">A new inquiry was submitted through fortresstaxadvisors.com. Replying to this message will reply directly to ${escapeHtml(inquiry.name)}.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-top:1px solid ${LINE};">${rows}</table>
      <p style="margin:26px 0 0;color:${MUTED};font-size:12px;line-height:20px;">Treat inquiry content as confidential. Move document exchange and sensitive taxpayer information to an approved secure channel.</p>`,
  });

  const text = [
    "NEW CONSULTATION INQUIRY",
    "",
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    inquiry.phone ? `Phone: ${inquiry.phone}` : null,
    inquiry.role ? `Role / title: ${inquiry.role}` : null,
    inquiry.organization ? `Organization: ${inquiry.organization}` : null,
    `Entity type: ${entity}`,
    `Timeline: ${timeline}`,
    `How they found us: ${heard}`,
    "",
    "Situation:",
    inquiry.situation,
    "",
    `Received: ${receivedAt}`,
    `Submission ID: ${inquiry.submissionId}`,
    "",
    "Reply to this email to reply directly to the submitter.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return {
    from,
    to: [to],
    replyTo: inquiry.email,
    subject: `New consultation inquiry — ${inquiry.name}`,
    html,
    text,
    tags: [
      { name: "message_type", value: "contact_internal" },
      { name: "submission_id", value: inquiry.submissionId },
    ],
  };
}

function buildSubmitterEmail(
  inquiry: ContactInquiry,
  from: string,
  replyEmail: string
): ContactEmail {
  const html = emailShell({
    preheader: "Thank you for contacting Fortress Tax Advisors.",
    eyebrow: "Inquiry received",
    title: `Thank you for reaching out, ${firstName(inquiry.name)}.`,
    body: `
      <p style="margin:0 0 20px;color:${INK};font-size:16px;line-height:27px;">We&rsquo;ve received your inquiry. A Fortress advisor will review what you shared and respond within one business day.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0;background:#f8f4ed;border-left:3px solid ${BRASS};">
        <tr>
          <td style="padding:22px 24px;">
            <div style="color:#6e5226;font-size:10px;line-height:16px;font-weight:bold;text-transform:uppercase;letter-spacing:1.8px;">What happens next</div>
            <p style="margin:9px 0 0;color:${MUTED};font-size:14px;line-height:24px;">We read the situation before responding, so the first conversation can begin with context. We may ask a small number of clarifying questions before recommending the right next step.</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 24px;color:${MUTED};font-size:14px;line-height:24px;">If your matter has an immediate deadline, reply to this email and include the date. Please do not send Social Security numbers, tax identification numbers, account credentials, tax documents, or other sensitive records by ordinary email.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="background:${SLATE};">
            <a href="${SITE_URL}/insights" style="display:inline-block;padding:13px 20px;color:#ffffff;font-size:13px;line-height:18px;font-weight:bold;text-decoration:none;">Read Fortress insights&nbsp;&nbsp;→</a>
          </td>
        </tr>
      </table>
      <p style="margin:30px 0 0;color:${MUTED};font-size:12px;line-height:20px;">This acknowledgment does not create an advisor-client relationship or constitute tax or legal advice. Formal services begin only under a signed engagement agreement.</p>`,
  });

  const text = [
    `Thank you for reaching out, ${firstName(inquiry.name)}.`,
    "",
    "We have received your inquiry. A Fortress advisor will review what you shared and respond within one business day.",
    "",
    "WHAT HAPPENS NEXT",
    "We read the situation before responding, so the first conversation can begin with context. We may ask a small number of clarifying questions before recommending the right next step.",
    "",
    "If your matter has an immediate deadline, reply to this email and include the date.",
    "",
    "Please do not send Social Security numbers, tax identification numbers, account credentials, tax documents, or other sensitive records by ordinary email.",
    "",
    `${SITE_URL}/insights`,
    "",
    "This acknowledgment does not create an advisor-client relationship or constitute tax or legal advice. Formal services begin only under a signed engagement agreement.",
  ].join("\n");

  return {
    from,
    to: [inquiry.email],
    replyTo: replyEmail,
    subject: "Thank you for contacting Fortress Tax Advisors",
    html,
    text,
    tags: [
      { name: "message_type", value: "contact_confirmation" },
      { name: "submission_id", value: inquiry.submissionId },
    ],
  };
}

export function buildContactEmails({
  inquiry,
  from,
  to,
  replyEmail,
}: {
  inquiry: ContactInquiry;
  from: string;
  to: string;
  replyEmail: string;
}) {
  return [
    buildInternalEmail(inquiry, from, to),
    buildSubmitterEmail(inquiry, from, replyEmail),
  ];
}
