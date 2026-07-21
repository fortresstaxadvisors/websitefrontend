import { listPaymentOperations } from "@/lib/square-operations";
import { listBillingEvents } from "@/lib/billing-operations-store";

export async function GET() {
  try {
    const [operations, events] = await Promise.all([listPaymentOperations(), listBillingEvents()]);
    return Response.json({ ...operations, events });
  } catch (cause) {
    return Response.json({ error: cause instanceof Error ? cause.message : "Could not load payment operations" }, { status: 502 });
  }
}
