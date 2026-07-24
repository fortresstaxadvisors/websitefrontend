import "server-only";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";

type SandboxInvoiceEmail = {
  clientName: string;
  email: string;
  invoiceNumber: string;
  title: string;
  publicUrl?: string;
};

let client: SESv2Client | undefined;

function emailAddress(value: string | undefined, name: string) {
  const normalized = value?.trim();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) {
    throw new Error(`${name} is invalid`);
  }
  return normalized;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export async function sendSandboxInvoiceReadyEmail(input: SandboxInvoiceEmail) {
  if (process.env.FORTRESS_DEPLOYMENT_STAGE !== "sandbox"
    || process.env.FORTRESS_SANDBOX_INVOICE_EMAIL !== "true") {
    return { configured: false } as const;
  }
  if (process.env.SQUARE_ENVIRONMENT !== "sandbox") {
    throw new Error("Sandbox invoice email cannot use the Square production environment");
  }
  if (!input.publicUrl) throw new Error("Published Square Sandbox invoice has no payment URL");
  const paymentUrl = new URL(input.publicUrl);
  if (paymentUrl.protocol !== "https:" || paymentUrl.hostname !== "app.squareupsandbox.com") {
    throw new Error("Sandbox invoice email refused a non-Sandbox Square payment URL");
  }

  const region = process.env.FORTRESS_AWS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region) throw new Error("FORTRESS_AWS_REGION is not configured");
  const from = emailAddress(process.env.FORTRESS_TRANSACTIONAL_EMAIL_FROM, "Transactional sender");
  const replyTo = emailAddress(process.env.FORTRESS_TRANSACTIONAL_EMAIL_REPLY_TO, "Transactional reply-to");
  const recipient = emailAddress(input.email, "Invoice recipient");
  const clientName = escapeHtml(input.clientName);
  const invoiceNumber = escapeHtml(input.invoiceNumber);
  const title = escapeHtml(input.title);
  const href = escapeHtml(paymentUrl.href);

  client ||= new SESv2Client({ region });
  await client.send(new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [recipient] },
    ReplyToAddresses: [replyTo],
    Content: {
      Simple: {
        Subject: { Charset: "UTF-8", Data: `[TEST — no real charge] Invoice ${input.invoiceNumber} is ready` },
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: [
              `Hello ${input.clientName},`,
              "",
              `Your Fortress Tax Advisors test invoice ${input.invoiceNumber} (${input.title}) is ready.`,
              "This is a Sandbox test. It cannot charge a real credit card or move real funds.",
              "",
              `Open the Square Sandbox invoice: ${paymentUrl.href}`,
              "",
              "Use only Square's published Sandbox test payment methods. Do not enter a real card or bank account.",
              `Questions: ${replyTo}`,
            ].join("\n"),
          },
          Html: {
            Charset: "UTF-8",
            Data: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#172033;line-height:1.55"><p>Hello ${clientName},</p><p>Your Fortress Tax Advisors test invoice <strong>${invoiceNumber}</strong> (${title}) is ready.</p><p style="padding:12px;border:1px solid #b45309;background:#fffbeb"><strong>TEST — no real charge:</strong> this Square Sandbox invoice cannot charge a real credit card or move real funds.</p><p><a href="${href}" style="display:inline-block;padding:12px 18px;background:#183153;color:#fff;text-decoration:none;border-radius:6px">Open test invoice</a></p><p>Use only Square's published Sandbox test payment methods. Do not enter a real card or bank account.</p><p>Questions: <a href="mailto:${escapeHtml(replyTo)}">${escapeHtml(replyTo)}</a></p></body></html>`,
          },
        },
      },
    },
    EmailTags: [
      { Name: "fortress_stage", Value: "sandbox" },
      { Name: "fortress_message", Value: "invoice_ready" },
    ],
  }));
  return { configured: true } as const;
}
