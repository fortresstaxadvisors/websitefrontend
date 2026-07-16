import { squareFetch, squareLocationId } from "@/lib/square";

type SquareInvoice = { id: string; version: number; invoice_number?: string; title?: string; status?: string; public_url?: string; updated_at?: string; primary_recipient?: { email_address?: string }; payment_requests?: { due_date?: string; computed_amount_money?: { amount?: number } }[] };

export async function GET() {
  try {
    const location = squareLocationId();
    const data = await squareFetch<{ invoices?: SquareInvoice[] }>(`/v2/invoices?location_id=${encodeURIComponent(location)}&limit=50`);
    return Response.json({ invoices: (data.invoices || []).map(summary) });
  } catch (cause) { return Response.json({ error: cause instanceof Error ? cause.message : "Could not load invoices" }, { status: 502 }); }
}

function summary(invoice: SquareInvoice) { return { id: invoice.id, number: invoice.invoice_number || invoice.id, status: invoice.status || "UNKNOWN", title: invoice.title || "Invoice", email: invoice.primary_recipient?.email_address || "", amount: invoice.payment_requests?.reduce((sum, p) => sum + (p.computed_amount_money?.amount || 0), 0) || 0, dueDate: invoice.payment_requests?.at(-1)?.due_date, publicUrl: invoice.public_url, updatedAt: invoice.updated_at }; }
