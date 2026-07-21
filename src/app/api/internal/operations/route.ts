import { listPaymentOperations } from "@/lib/square-operations";
import { listBillingEvents } from "@/lib/billing-operations-store";

export async function GET() {
  try {
    const [operations, eventResult] = await Promise.all([
      listPaymentOperations(),
      listBillingEvents().then((events) => ({ events, warning: undefined })).catch((cause) => ({ events: [], warning: cause instanceof Error ? cause.message : "Could not load webhook receipts" })),
    ]);
    return Response.json({
      ...operations,
      events: eventResult.events,
      warnings: [...operations.warnings, ...(eventResult.warning ? [`Webhook receipts could not be loaded: ${eventResult.warning}`] : [])],
    });
  } catch (cause) {
    return Response.json({ error: cause instanceof Error ? cause.message : "Could not load payment operations" }, { status: 502 });
  }
}
