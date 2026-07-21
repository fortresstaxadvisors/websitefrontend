import { squareFetch, squareLocationId } from "@/lib/square";

type SquareInvoice = {
  id: string;
  version: number;
  invoice_number?: string;
  order_id?: string;
  title?: string;
  status?: string;
  public_url?: string;
  updated_at?: string;
  primary_recipient?: { email_address?: string };
  accepted_payment_methods?: { card?: boolean; bank_account?: boolean };
  payment_requests?: { due_date?: string; computed_amount_money?: { amount?: number }; total_completed_amount_money?: { amount?: number } }[];
};

export async function GET() {
  try {
    const location = squareLocationId();
    const invoices: SquareInvoice[] = [];
    const seenCursors = new Set<string>();
    let cursor: string | undefined;
    do {
      const data = await squareFetch<{ invoices?: SquareInvoice[]; cursor?: string }>(`/v2/invoices?location_id=${encodeURIComponent(location)}&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
      invoices.push(...(data.invoices || []));
      const nextCursor = data.cursor;
      if (nextCursor && seenCursors.has(nextCursor)) throw new Error("Square returned a repeated invoice cursor");
      if (nextCursor) seenCursors.add(nextCursor);
      cursor = nextCursor;
    } while (cursor && invoices.length < 500);
    return Response.json({ invoices: invoices.map(summary), warning: cursor ? "Square invoice history is truncated at 500 records" : undefined });
  } catch (cause) { return Response.json({ error: cause instanceof Error ? cause.message : "Could not load invoices" }, { status: 502 }); }
}

function summary(invoice: SquareInvoice) { return { id: invoice.id, orderId: invoice.order_id || "", number: invoice.invoice_number || invoice.id, status: invoice.status || "UNKNOWN", title: invoice.title || "Invoice", email: invoice.primary_recipient?.email_address || "", amount: invoice.payment_requests?.reduce((sum, p) => sum + (p.computed_amount_money?.amount || 0), 0) || 0, completedAmount: invoice.payment_requests?.reduce((sum, p) => sum + (p.total_completed_amount_money?.amount || 0), 0) || 0, acceptsCard: invoice.accepted_payment_methods?.card === true, acceptsAch: invoice.accepted_payment_methods?.bank_account === true, dueDate: invoice.payment_requests?.at(-1)?.due_date, publicUrl: invoice.public_url, updatedAt: invoice.updated_at }; }
