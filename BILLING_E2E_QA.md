# Billing workflow final QA audit

**Audit date:** July 21, 2026  
**Environment:** Fortress Amplify Sandbox, self-hosted DocuSeal, Square Sandbox  
**Candidate:** `ba53a0a` (`codex/billing-automation`)  
**Scope:** Staff UX, client payment UX, signature gate, card, ACH, checks, refunds, disputes, webhooks, idempotency, human error, security boundaries, mobile/accessibility basics, build and dependency health.

## Release verdict

The Sandbox workflow is suitable for continued internal testing. It is **not approved for real-client production use**. Production remains blocked by the counsel-approved agreement and terms, named MFA staff authentication, a real check payee/remittance address, immediate external dispute alert/ownership workflow, production ACH/check operating policies, production credentials, and a low-value live pilot.

No technical or contractual control can guarantee that a payment will never be disputed, returned, or charged back. The intended production claim is risk reduction, strong evidence, and fast exception handling.

## Human-simulation results

| Area | Scenario | Result |
|---|---|---|
| Staff engagement | Create fictional $1 workflow from the private console | Passed; prior React form-reset bug did not recur |
| Signature | Email-OTP protection on fictional signer | Passed security boundary; current batch stopped before sending an OTP to a non-test inbox |
| Signature → invoice | Full two-signer Sandbox completion and replay | Passed in the earlier browser run; exactly one Square invoice was created on replay |
| Card decline | Official Square declined-card path | Passed; payment stayed `FAILED`, invoice stayed `UNPAID` |
| ACH | Official Plaid Sandbox bank login | Passed; `PENDING → COMPLETED`, invoice `PAYMENT_PENDING → PAID` |
| ACH operations | Attempt automated refund | Passed safety check; rejected as non-card |
| Check receipt | Receive, deposit, clear | Passed; invoice never became paid merely from local check status |
| Check error | Wrong typed confirmation | Passed; destructive transition remained disabled/rejected |
| Check return | Return before reconciliation | Passed; invoice remained `UNPAID` |
| Check reconciliation | Supply unrelated failed-card payment | Passed safety check; rejected |
| Check reconciliation | Exact completed Square external-check payment | Not executable safely in Sandbox; requires a Dashboard-recorded external check in a production pilot |
| Card refund | Exact full $1 refund to original card | Passed; one `COMPLETED` refund |
| Duplicate refund | Retry against refunded payment | Passed; no second refund was created |
| Dispute | Official $88.04 Square Sandbox trigger | Passed detection; `EVIDENCE_REQUIRED` dispute appeared with deadline and linked durable receipts |
| Webhooks | Payment, invoice, order, refund, and dispute receipts | Passed; verified events persisted in DynamoDB |
| Authentication | Private endpoints without credentials | Passed; `401` |
| Webhook forgery | Unsigned Square/DocuSeal callbacks | Passed; `403` |

The dispute test created Sandbox dispute `ERe4pzIdgtko1vCQA5ZGN`, reason `NO_KNOWLEDGE`, state `EVIDENCE_REQUIRED`, amount `$88.04`, due August 3, 2026. No evidence or challenge was submitted.

## Defects corrected during the audit

- Prevented same-tick double submission and false post-send refresh failures.
- Added durable invoice-number reservations, canonical submission binding, safe stale-reservation recovery, and Sandbox link recovery.
- Added strict email confirmation, identifiers, text lengths, dates, decimal line-item parsing, and Central Time date handling.
- Added provider timeouts and bounded, same-origin PDF downloads.
- Added pagination/repeated-cursor protection and visible truncation/partial-data warnings.
- Added ACH pending warnings and kept pending invoices in the open-work count.
- Added partial, installment, replacement, returned, and post-reconciliation check handling.
- Preserved append-only check tender snapshots: amount, masked reference, and Square payment ID.
- Added exact Square external-check tender/amount verification before reconciliation.
- Added signed, expiring exact-refund preview; exact card-only balance; opaque Square version token; active-dispute guard; idempotent refund reference.
- Added dispute-to-payment/order/invoice/client linkage, evidence deadline, and an operator evidence checklist.
- Disabled check remittance instructions unless both the approved payee and address are configured.
- Updated Next.js and forced patched `sharp`; full dependency audit reports zero known vulnerabilities.

## Automated verification

- 19/19 Node tests passed.
- TypeScript passed with no errors.
- ESLint passed.
- Next.js production build passed; 170 routes generated.
- `npm audit` passed with zero known vulnerabilities.
- `git diff --check` passed.

## Production blockers and residual risk

1. Replace the Sandbox agreement and public legal placeholders with counsel-approved production documents and an auditable DocuSeal template version.
2. Replace shared Basic Auth with named staff accounts, MFA, roles, and actor IDs on every refund/check/dispute action.
3. Configure the exact legal check payee and remittance address. Test a real low-value check through Dashboard recording, bank clearance, reconciliation, and a return/correction drill.
4. Add immediate dispute alerts to at least two named people, ownership/acknowledgment, daily deadline escalation, and evidence-submission tracking. The current console detects and explains disputes but does not submit evidence.
5. Adopt a written ACH fulfillment/hold policy. Consumer ACH returns can occur well after `COMPLETED` and cannot be contested through Square.
6. Add a durable SQS/outbox worker, retry/DLQ alarms, replay tooling, DynamoDB point-in-time recovery/retention, and tested restore procedures before webhooks cause non-idempotent bookkeeping or messaging.
7. Configure production Square/DocuSeal/email credentials and run one authorized low-value production card payment/refund plus ACH and check pilots.
8. Add post-service milestone/final acceptance and delivery evidence to strengthen service-dispute packages.

## Sandbox cleanup

Orphan draft invoices `QA-PAY-20260721-7C91` and `QA-PAY-20260721-8D52` can be archived or canceled in Square Sandbox. They do not affect production.
