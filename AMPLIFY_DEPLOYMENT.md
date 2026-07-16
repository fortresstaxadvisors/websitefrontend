# Amplify deployment for billing runtime

The public site remains an Amplify Hosting `WEB_COMPUTE` application. Next.js is
pinned to the latest supported 15.x release, and the billing routes use Node.js
middleware plus an Amplify SSR Compute role to read one production JSON secret
at request time. No production credential is copied to `.env.production` or a
build artifact.

No command in this document has been run against AWS.

## 1. Create the production SecretString

Prepare an untracked, mode-0600 JSON file from
`config/runtime-secret.example.json`. Generate independent random values for the
admin password and billing workflow HMAC secret. Use the actual Square seller
token, Square webhook signature key, DocuSeal API token, and DocuSeal `whsec_...`
HMAC secret. Omit `PAYMENT_EVENT_FORWARD_TOKEN` when no authenticated relay is
configured.

Create one regional Secrets Manager secret, for example
`fortress/website/billing-production`. The application expects a JSON
`SecretString`, not binary data. Record its complete ARN, including the random
suffix, then securely delete the temporary JSON file.

Never configure any key from `runtime-secret.example.json` as an Amplify app or
branch environment variable. `SQUARE_DEVELOPER_ACCESS_TOKEN` is workstation-only
and is never part of the runtime secret.

## 2. Create the least-privilege SSR Compute role

Use a dedicated role, not the Amplify build/service role. Its only application
permission should be:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadFortressBillingRuntimeSecret",
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:fortress/website/billing-production-RANDOM_SUFFIX"
    }
  ]
}
```

If the secret uses a customer-managed KMS key, add `kms:Decrypt` for that one key
and restrict it with `kms:ViaService` equal to
`secretsmanager.REGION.amazonaws.com`. The default `aws/secretsmanager` key does
not require a separate application permission statement.

AWS documents `amplify.amazonaws.com` as the trusted service for an SSR Compute
role. Restrict the trust to the production account and branch to prevent a
confused-deputy path:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "amplify.amazonaws.com" },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": { "aws:SourceAccount": "ACCOUNT_ID" },
        "ArnLike": {
          "aws:SourceArn": "arn:aws:amplify:REGION:ACCOUNT_ID:apps/APP_ID/branches/PRODUCTION_BRANCH"
        }
      }
    }
  ]
}
```

Attach the role only to the production branch under **Amplify → App settings →
IAM roles → Compute role**. Do not attach it to pull-request previews or automatic
branches. The equivalent reviewed CLI operation is:

```bash
aws amplify update-branch \
  --app-id APP_ID \
  --branch-name PRODUCTION_BRANCH \
  --compute-role-arn arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME
```

If this is an older Amplify app that is not already on the `WEB_COMPUTE`
platform, update the platform separately in the console or with:

```bash
aws amplify update-app --app-id APP_ID --platform WEB_COMPUTE
```

The operator needs `amplify:UpdateBranch` and `iam:PassRole` scoped to this app
and role. Add `amplify:UpdateApp` only if the one-time platform transition is
required. The role itself needs no Square, Lightsail, S3, DocuSeal, or other AWS
permissions.

## 3. Configure only non-secret Amplify branch variables

Set the values from `config/payments.env.example` on the intended branch. The
required production values are:

- `FORTRESS_RUNTIME_SECRET_ID`: complete secret ARN or exact secret name.
- `FORTRESS_AWS_REGION`: the secret's region.
- `PAYMENT_BASE_URL`: canonical HTTPS website origin.
- `SQUARE_ENVIRONMENT=production`.
- `SQUARE_LOCATION_ID`: the active production seller location.
- `SQUARE_WEBHOOK_NOTIFICATION_URL`: exactly
  `${PAYMENT_BASE_URL}/api/webhooks/square`.
- `DOCUSEAL_BASE_URL`: the HTTPS DocuSeal API URL ending in `/api`.
- `DOCUSEAL_ENGAGEMENT_TEMPLATE_ID` and exact client role.

Set `SQUARE_ENABLE_ACH=true` only after the production seller/location supports
bank-account payment. `SQUARE_SANDBOX_SKIP_ATTACHMENTS` must be `false` or absent
in production. Set the firm signer name and email together when the template
requires Fortress countersignature.

The build specification calls `scripts/write-amplify-runtime-config.mjs`, which
validates these values and writes only its fixed non-secret allowlist. It ignores
all other environment variables. Amplify builds use Node 22 and `npm ci`.

## 4. Deploy and verify in Sandbox first

1. Push a reviewed feature branch and deploy with sandbox-only configuration and
   a separate sandbox secret/Compute role. Do not give a public PR branch access
   to the production role.
2. Confirm an unauthenticated request to `/internal/invoices` returns `401`, an
   incorrect or unavailable secret returns a private/no-store `503`, and correct
   credentials reach the console.
3. Confirm forged Square and DocuSeal webhooks return `403` and an unavailable
   secret returns `503`.
4. Create the DocuSeal HMAC webhook and one Square subscription only after the
   stable HTTPS callback URLs exist. Store the returned Square signature key in
   the sandbox secret.
5. Complete the signed agreement → audit PDF → Square invoice → payment → event
   relay → refund test. Replay the completion event and confirm no duplicate
   Square invoice is created.
6. Inspect Amplify build artifacts and logs for every secret value. Any match is
   a launch blocker requiring immediate rotation.

After Sandbox passes, repeat with the production branch-specific role and secret,
run one low-value production payment/refund pilot, and enable CloudWatch alarms
for middleware/API 5xx responses. Rotate a secret by writing a new Secrets
Manager version; warm runtimes refresh within the configured 30–3600 second
cache window (300 seconds by default).

## References

- AWS Amplify support for Next.js: https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html
- Amplify SSR Compute roles: https://docs.aws.amazon.com/amplify/latest/userguide/amplify-SSR-compute-role.html
- Amplify SSR environment guidance: https://docs.aws.amazon.com/amplify/latest/userguide/ssr-environment-variables.html
- Next.js 15 middleware: https://nextjs.org/docs/15/app/api-reference/file-conventions/middleware
