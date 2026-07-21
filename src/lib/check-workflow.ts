export const CHECK_STATES = [
  "RECEIVED",
  "DEPOSITED",
  "CLEARED_AWAITING_SQUARE",
  "RETURNED",
  "RECONCILED",
] as const;

export type CheckState = (typeof CHECK_STATES)[number];

export const CHECK_ACTIONS = [
  "RECEIVE",
  "DEPOSIT",
  "CLEAR",
  "RETURN",
  "RECONCILE",
] as const;

export type CheckAction = (typeof CHECK_ACTIONS)[number];

const ACTION_STATE: Record<CheckAction, CheckState> = {
  RECEIVE: "RECEIVED",
  DEPOSIT: "DEPOSITED",
  CLEAR: "CLEARED_AWAITING_SQUARE",
  RETURN: "RETURNED",
  RECONCILE: "RECONCILED",
};

const ALLOWED_TRANSITIONS: Partial<Record<CheckState, readonly CheckAction[]>> = {
  RECEIVED: ["DEPOSIT", "RETURN"],
  DEPOSITED: ["CLEAR", "RETURN"],
  CLEARED_AWAITING_SQUARE: ["RECONCILE", "RETURN"],
};

export class CheckTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckTransitionError";
  }
}

export function parseCheckAction(value: unknown): CheckAction {
  if (typeof value !== "string" || !CHECK_ACTIONS.includes(value as CheckAction)) {
    throw new CheckTransitionError("Check action is invalid");
  }
  return value as CheckAction;
}

export function targetStateForAction(action: CheckAction): CheckState {
  return ACTION_STATE[action];
}

export function validateCheckTransition(
  current: CheckState | null,
  action: CheckAction,
): { state: CheckState; idempotent: boolean } {
  const target = targetStateForAction(action);
  if (current === target) return { state: current, idempotent: true };

  if (current === null) {
    if (action === "RECEIVE") return { state: "RECEIVED", idempotent: false };
    throw new CheckTransitionError("A check must be received before it can be updated");
  }

  if (!ALLOWED_TRANSITIONS[current]?.includes(action)) {
    throw new CheckTransitionError(`Check cannot move from ${current} using ${action}`);
  }

  return { state: target, idempotent: false };
}

export function maskCheckReference(value: unknown): string {
  if (typeof value !== "string") {
    throw new CheckTransitionError("Check reference is required when receiving a check");
  }
  const normalized = value.trim();
  if (!/^[A-Za-z0-9-]{2,8}$/.test(normalized)) {
    throw new CheckTransitionError("Check reference must be 2 to 8 letters, numbers, or hyphens");
  }
  return normalized.slice(-4);
}

export type ReconciliationPayment = {
  status?: string;
  source_type?: string;
  amount_money?: { amount?: number; currency?: string };
  external_details?: { type?: string };
};

export function isMatchingClearedCheckPayment(
  payment: ReconciliationPayment,
  amount: number,
): boolean {
  return payment.status === "COMPLETED"
    && payment.source_type === "EXTERNAL"
    && payment.external_details?.type === "CHECK"
    && payment.amount_money?.currency === "USD"
    && payment.amount_money.amount === amount;
}
