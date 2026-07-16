#!/usr/bin/env bash

# Restores the DocuSeal HMAC after the first Sandbox release and removes the
# one-time encrypted transport object. Run only from authenticated AWS
# CloudShell.

fortress_recover_billing_sandbox_secret() (
  set -euo pipefail
  umask 077

  readonly AWS_REGION="us-east-1"
  readonly SECRET_ID="fortress/website/billing-sandbox"
  readonly BUCKET="fortress-docuseal-backups-346133548144"
  readonly BUCKET_OWNER="346133548144"
  readonly OBJECT_KEY="daily/one-time-docuseal-hmac-9dab3fd5-886c-447c-bb1d-ce057c98a598.json"
  readonly BASE_URL="https://codex-billing-automation.d1th51h382rpvi.amplifyapp.com"

  local temp_dir transport secret_json docuseal_hmac updated_secret
  temp_dir="$(mktemp -d)"
  transport="${temp_dir}/docuseal-hmac.json"
  trap 'rm -rf "$temp_dir"' EXIT

  echo "Retrieving the encrypted one-time DocuSeal verification secret..."
  aws s3api get-object \
    --region "$AWS_REGION" \
    --bucket "$BUCKET" \
    --expected-bucket-owner "$BUCKET_OWNER" \
    --key "$OBJECT_KEY" \
    "$transport" \
    >/dev/null
  docuseal_hmac="$(jq -er '.DOCUSEAL_WEBHOOK_SECRET | select(startswith("whsec_"))' "$transport")"

  secret_json="$(
    aws secretsmanager get-secret-value \
      --region "$AWS_REGION" \
      --secret-id "$SECRET_ID" \
      --query SecretString \
      --output text
  )"
  jq -e '
    .SQUARE_ACCESS_TOKEN |
    select(type == "string" and length > 10)
  ' <<<"$secret_json" >/dev/null
  jq -e '
    .SQUARE_WEBHOOK_SIGNATURE_KEY |
    select(type == "string" and length > 10)
  ' <<<"$secret_json" >/dev/null
  jq -e '
    .DOCUSEAL_API_TOKEN |
    select(type == "string" and length > 10)
  ' <<<"$secret_json" >/dev/null

  updated_secret="$(
    jq --arg hmac "$docuseal_hmac" '.DOCUSEAL_WEBHOOK_SECRET=$hmac' <<<"$secret_json"
  )"
  aws secretsmanager put-secret-value \
    --region "$AWS_REGION" \
    --secret-id "$SECRET_ID" \
    --secret-string "$updated_secret" \
    >/dev/null
  unset secret_json updated_secret docuseal_hmac

  aws s3api delete-object \
    --region "$AWS_REGION" \
    --bucket "$BUCKET" \
    --expected-bucket-owner "$BUCKET_OWNER" \
    --key "$OBJECT_KEY" \
    >/dev/null
  rm -f "$transport"

  echo "Waiting for the Amplify runtime secret cache to refresh..."
  local admin_status square_status docuseal_status
  for _ in {1..18}; do
    admin_status="$(curl -sS -o /dev/null -w '%{http_code}' "${BASE_URL}/internal/invoices")"
    square_status="$(
      curl -sS -o /dev/null -w '%{http_code}' \
        -X POST -H 'Content-Type: application/json' --data '{}' \
        "${BASE_URL}/api/webhooks/square"
    )"
    docuseal_status="$(
      curl -sS -o /dev/null -w '%{http_code}' \
        -X POST -H 'Content-Type: application/json' --data '{}' \
        "${BASE_URL}/api/webhooks/docuseal"
    )"
    if [[ "$admin_status" == "401" && "$square_status" == "403" && "$docuseal_status" == "403" ]]; then
      echo "Recovered: private console=401, Square forged callback=403, DocuSeal forged callback=403."
      return 0
    fi
    sleep 10
  done

  echo "Recovery values were stored, but route verification did not converge." >&2
  echo "console=${admin_status} square=${square_status} docuseal=${docuseal_status}" >&2
  return 1
)

fortress_status=0
fortress_recover_billing_sandbox_secret || fortress_status=$?

unset SQUARE_TOKEN DOCUSEAL_TOKEN ADMIN_PASSWORD BILLING_SECRET
unset SQUARE_WEBHOOK_TEMP DOCUSEAL_WEBHOOK_TEMP SECRET_JSON
unset ACCOUNT_ID SECRET_ARN TRUST POLICY ROLE_ARN
rm -f /tmp/fortress-token.pem
unset -f fortress_recover_billing_sandbox_secret

if ((fortress_status != 0)); then
  echo "Recovery stopped with status ${fortress_status}; temporary CloudShell material was still cleared." >&2
  return "$fortress_status" 2>/dev/null || exit "$fortress_status"
fi

unset fortress_status
echo "Temporary CloudShell variables, transport object, and obsolete transport key are removed."
