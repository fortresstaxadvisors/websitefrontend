import { issueFullInvoiceRefund, previewFullInvoiceRefund } from "@/lib/square-operations";
import { readWebhookBody, WebhookBodyTooLargeError } from "@/lib/webhook-body";

function sameOrigin(request: Request) {
  const baseUrl = process.env.PAYMENT_BASE_URL;
  if (!baseUrl) throw new Error("PAYMENT_BASE_URL is not configured");
  return request.headers.get("origin") === new URL(baseUrl).origin;
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return new Response("Invalid request origin", { status: 403 });
    let raw: string;
    try { raw = await readWebhookBody(request, 16_384); }
    catch (cause) {
      if (cause instanceof WebhookBodyTooLargeError) return Response.json({ error: "Request body is too large" }, { status: 413 });
      throw cause;
    }
    const body = JSON.parse(raw) as Record<string, unknown>;
    const invoiceId = typeof body.invoiceId === "string" ? body.invoiceId : "";
    const invoiceNumber = typeof body.invoiceNumber === "string" ? body.invoiceNumber.trim() : "";
    if (body.action === "preview") {
      const preview = await previewFullInvoiceRefund({ invoiceId, invoiceNumber });
      return Response.json({ preview }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
    }
    if (body.confirmed !== true) throw new Error("Confirm the full refund before submitting");
    const refund = await issueFullInvoiceRefund({
      invoiceId,
      invoiceNumber,
      reason: typeof body.reason === "string" ? body.reason : "",
      reference: typeof body.reference === "string" ? body.reference : "",
      previewToken: typeof body.previewToken === "string" ? body.previewToken : "",
    });
    return Response.json({ refund });
  } catch (cause) {
    return Response.json({ error: cause instanceof Error ? cause.message : "Refund failed" }, { status: 422 });
  }
}
