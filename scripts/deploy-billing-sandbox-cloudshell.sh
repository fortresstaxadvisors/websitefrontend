#!/usr/bin/env bash

# Run from the already authenticated AWS CloudShell with:
# source <(curl -fsSL https://raw.githubusercontent.com/fortresstaxadvisors/websitefrontend/codex/billing-automation/scripts/deploy-billing-sandbox-cloudshell.sh)

fortress_deploy_billing_sandbox() (
  set -euo pipefail
  umask 077

  readonly AWS_REGION="us-east-1"
  readonly APP_ID="d1th51h382rpvi"
  readonly BRANCH="codex/billing-automation"
  readonly BASE_URL="https://codex-billing-automation.d1th51h382rpvi.amplifyapp.com"
  readonly SECRET_ID="fortress/website/billing-sandbox"
  readonly SQUARE_LOCATION_ID="LE0JJ26BSF0CX"
  readonly DOCUSEAL_TEMPLATE_ID="3"
  readonly TRANSPORT_QUEUE_NAME="fortress-docuseal-secret-transport"
  readonly SQUARE_VERSION="2026-05-20"
  readonly SQUARE_WEBHOOK_URL="${BASE_URL}/api/webhooks/square"
  readonly DOCUSEAL_WEBHOOK_URL="${BASE_URL}/api/webhooks/docuseal"

  local temp_dir queue_url
  temp_dir="$(mktemp -d)"
  cleanup() {
    if [[ -n "${queue_url:-}" ]]; then
      aws sqs delete-queue --region "$AWS_REGION" --queue-url "$queue_url" >/dev/null 2>&1 || true
    fi
    rm -rf "$temp_dir"
  }
  trap cleanup EXIT

  command -v aws >/dev/null
  command -v curl >/dev/null
  command -v jq >/dev/null

  echo "Verifying the authenticated AWS account and Sandbox branch..."
  aws sts get-caller-identity --region "$AWS_REGION" >/dev/null
  aws amplify get-branch --region "$AWS_REGION" --app-id "$APP_ID" --branch-name "$BRANCH" >/dev/null

  echo "Opening an encrypted, five-minute one-time secret transport from the DocuSeal host..."
  queue_url="$(
    aws sqs create-queue \
      --region "$AWS_REGION" \
      --queue-name "$TRANSPORT_QUEUE_NAME" \
      --attributes MessageRetentionPeriod=300,VisibilityTimeout=30,SqsManagedSseEnabled=true \
      --query QueueUrl \
      --output text
  )"
  local account_id lightsail_role_arn queue_arn queue_policy message receipt_handle docuseal_hmac
  account_id="$(aws sts get-caller-identity --query Account --output text)"
  lightsail_role_arn="$(
    aws iam get-role \
      --role-name AmazonLightsailInstanceRole \
      --query Role.Arn \
      --output text
  )"
  queue_arn="arn:aws:sqs:${AWS_REGION}:${account_id}:${TRANSPORT_QUEUE_NAME}"
  queue_policy="$(
    jq -cn \
      --arg queue "$queue_arn" \
      --arg principal "$lightsail_role_arn" \
      '{
        Version:"2012-10-17",
        Statement:[{
          Sid:"OneTimeDocuSealSecretTransport",
          Effect:"Allow",
          Principal:{AWS:$principal},
          Action:"sqs:SendMessage",
          Resource:$queue
        }]
      }'
  )"
  jq -n --arg policy "$queue_policy" '{Policy:$policy}' >"${temp_dir}/queue-attributes.json"
  aws sqs set-queue-attributes \
    --region "$AWS_REGION" \
    --queue-url "$queue_url" \
    --attributes "file://${temp_dir}/queue-attributes.json" \
    >/dev/null

  message="null"
  for _ in {1..6}; do
    message="$(
      aws sqs receive-message \
        --region "$AWS_REGION" \
        --queue-url "$queue_url" \
        --wait-time-seconds 20 \
        --max-number-of-messages 1 \
        --query 'Messages[0]' \
        --output json
    )"
    [[ "$message" != "null" ]] && break
  done
  [[ "$message" != "null" ]]
  receipt_handle="$(jq -er '.ReceiptHandle' <<<"$message")"
  docuseal_hmac="$(jq -er '.Body | fromjson | .DOCUSEAL_WEBHOOK_SECRET' <<<"$message")"
  aws sqs delete-message \
    --region "$AWS_REGION" \
    --queue-url "$queue_url" \
    --receipt-handle "$receipt_handle" \
    >/dev/null
  [[ "$docuseal_hmac" == whsec_* ]]
  unset message receipt_handle queue_policy lightsail_role_arn
  aws sqs delete-queue --region "$AWS_REGION" --queue-url "$queue_url" >/dev/null
  queue_url=""

  local environment_json update_input
  environment_json="$(
    jq -n \
      --arg base "$BASE_URL" \
      --arg secret "$SECRET_ID" \
      --arg region "$AWS_REGION" \
      --arg square_location "$SQUARE_LOCATION_ID" \
      --arg square_webhook "$SQUARE_WEBHOOK_URL" \
      --arg template "$DOCUSEAL_TEMPLATE_ID" \
      '{
        FORTRESS_DEPLOYMENT_STAGE: "sandbox",
        FORTRESS_RUNTIME_SECRET_ID: $secret,
        FORTRESS_AWS_REGION: $region,
        FORTRESS_SECRET_CACHE_TTL_SECONDS: "30",
        PAYMENT_BASE_URL: $base,
        SQUARE_ENVIRONMENT: "sandbox",
        SQUARE_LOCATION_ID: $square_location,
        SQUARE_SANDBOX_SKIP_ATTACHMENTS: "true",
        SQUARE_ENABLE_ACH: "false",
        SQUARE_WEBHOOK_NOTIFICATION_URL: $square_webhook,
        DOCUSEAL_BASE_URL: "https://sign.fortresstaxadvisors.com/api",
        DOCUSEAL_ENGAGEMENT_TEMPLATE_ID: $template,
        DOCUSEAL_CLIENT_ROLE: "Client",
        DOCUSEAL_FIRM_ROLE: "Fortress",
        DOCUSEAL_FIRM_SIGNER_NAME: "Omer Muhammad",
        DOCUSEAL_FIRM_SIGNER_EMAIL: "omer@fortresstaxadvisors.com",
        DOCUSEAL_REPLY_TO: "clientservice@fortresstaxadvisors.com",
        DOCUSEAL_SANDBOX_SEND_EMAIL: "false"
      }'
  )"
  update_input="$(
    jq -n \
      --arg app "$APP_ID" \
      --arg branch "$BRANCH" \
      --argjson environment "$environment_json" \
      '{appId:$app,branchName:$branch,environmentVariables:$environment,enableAutoBuild:false}'
  )"

  echo "Applying reviewed, non-secret branch configuration..."
  aws amplify update-branch --region "$AWS_REGION" --cli-input-json "$update_input" >/dev/null

  echo "Starting the Amplify Sandbox release..."
  local job_id job_status
  job_id="$(
    aws amplify start-job \
      --region "$AWS_REGION" \
      --app-id "$APP_ID" \
      --branch-name "$BRANCH" \
      --job-type RELEASE \
      --query 'jobSummary.jobId' \
      --output text
  )"
  while :; do
    job_status="$(
      aws amplify get-job \
        --region "$AWS_REGION" \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH" \
        --job-id "$job_id" \
        --query 'job.summary.status' \
        --output text
    )"
    echo "Amplify job ${job_id}: ${job_status}"
    case "$job_status" in
      SUCCEED) break ;;
      FAILED|CANCELLED)
        aws amplify get-job --region "$AWS_REGION" --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$job_id"
        return 1
        ;;
    esac
    sleep 15
  done

  echo "Waiting for the deployed billing routes..."
  local http_status
  for _ in {1..24}; do
    http_status="$(curl -sS -o /dev/null -w '%{http_code}' "${BASE_URL}/payments")"
    [[ "$http_status" == "200" ]] && break
    sleep 5
  done
  [[ "$http_status" == "200" ]]
  [[ "$(curl -sS -o /dev/null -w '%{http_code}' "${BASE_URL}/internal/invoices")" == "401" ]]
  [[ "$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' --data '{}' "$SQUARE_WEBHOOK_URL")" == "403" ]]
  [[ "$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' --data '{}' "$DOCUSEAL_WEBHOOK_URL")" == "403" ]]

  echo "Creating or locating the Square Sandbox webhook subscription..."
  local secret_json square_token subscriptions square_subscription_id square_signature
  secret_json="$(
    aws secretsmanager get-secret-value \
      --region "$AWS_REGION" \
      --secret-id "$SECRET_ID" \
      --query SecretString \
      --output text
  )"
  square_token="$(jq -er '.SQUARE_ACCESS_TOKEN' <<<"$secret_json")"
  subscriptions="${temp_dir}/square-subscriptions.json"
  curl -fsS \
    -H "Authorization: Bearer ${square_token}" \
    -H "Square-Version: ${SQUARE_VERSION}" \
    -H "Accept: application/json" \
    "https://connect.squareupsandbox.com/v2/webhooks/subscriptions?limit=100" \
    >"$subscriptions"
  square_subscription_id="$(
    jq -r --arg url "$SQUARE_WEBHOOK_URL" \
      '.subscriptions[]? | select(.notification_url == $url) | .id' \
      "$subscriptions" | head -1
  )"

  if [[ -z "$square_subscription_id" ]]; then
    local create_body create_response idempotency_key
    create_body="${temp_dir}/square-create.json"
    create_response="${temp_dir}/square-create-response.json"
    idempotency_key="$(python3 -c 'import uuid; print(uuid.uuid4())')"
    jq -n \
      --arg key "$idempotency_key" \
      --arg url "$SQUARE_WEBHOOK_URL" \
      --arg version "$SQUARE_VERSION" \
      '{
        idempotency_key:$key,
        subscription:{
          name:"Fortress Sandbox invoice and dispute automation",
          notification_url:$url,
          api_version:$version,
          event_types:[
            "invoice.published",
            "invoice.updated",
            "invoice.payment_made",
            "invoice.refunded",
            "invoice.canceled",
            "invoice.scheduled_charge_failed",
            "payment.updated",
            "dispute.created",
            "dispute.state.updated"
          ]
        }
      }' >"$create_body"
    curl -fsS \
      -X POST \
      -H "Authorization: Bearer ${square_token}" \
      -H "Square-Version: ${SQUARE_VERSION}" \
      -H "Content-Type: application/json" \
      --data-binary "@${create_body}" \
      "https://connect.squareupsandbox.com/v2/webhooks/subscriptions" \
      >"$create_response"
    square_subscription_id="$(jq -er '.subscription.id' "$create_response")"
    square_signature="$(jq -er '.subscription.signature_key' "$create_response")"
  else
    local get_response
    get_response="${temp_dir}/square-get-response.json"
    curl -fsS \
      -H "Authorization: Bearer ${square_token}" \
      -H "Square-Version: ${SQUARE_VERSION}" \
      -H "Accept: application/json" \
      "https://connect.squareupsandbox.com/v2/webhooks/subscriptions/${square_subscription_id}" \
      >"$get_response"
    square_signature="$(jq -er '.subscription.signature_key' "$get_response")"
  fi

  local updated_secret
  updated_secret="$(
    jq \
      --arg square "$square_signature" \
      --arg docuseal "$docuseal_hmac" \
      '.SQUARE_WEBHOOK_SIGNATURE_KEY=$square | .DOCUSEAL_WEBHOOK_SECRET=$docuseal' \
      <<<"$secret_json"
  )"
  aws secretsmanager put-secret-value \
    --region "$AWS_REGION" \
    --secret-id "$SECRET_ID" \
    --secret-string "$updated_secret" \
    >/dev/null

  unset square_token square_signature secret_json updated_secret docuseal_hmac
  echo "Stored the real Square and DocuSeal webhook verification secrets."
  sleep 35

  local square_body square_hmac docuseal_body docuseal_timestamp docuseal_hmac_header
  square_body='{"event_id":"fortress-sandbox-verification","type":"payment.updated","created_at":"2026-07-16T00:00:00Z"}'
  square_signature="$(
    aws secretsmanager get-secret-value --region "$AWS_REGION" --secret-id "$SECRET_ID" --query SecretString --output text |
      jq -er '.SQUARE_WEBHOOK_SIGNATURE_KEY'
  )"
  square_hmac="$(
    python3 -c 'import base64,hashlib,hmac,sys; key,url,body=sys.stdin.read().splitlines(); print(base64.b64encode(hmac.new(key.encode(),(url+body).encode(),hashlib.sha256).digest()).decode())' \
      <<<"${square_signature}"$'\n'"${SQUARE_WEBHOOK_URL}"$'\n'"${square_body}"
  )"
  [[ "$(
    curl -sS -o /dev/null -w '%{http_code}' \
      -X POST \
      -H 'Content-Type: application/json' \
      -H "x-square-hmacsha256-signature: ${square_hmac}" \
      --data-binary "$square_body" \
      "$SQUARE_WEBHOOK_URL"
  )" == "200" ]]

  docuseal_body='{"event_type":"template.updated","data":{"id":3}}'
  docuseal_timestamp="$(date +%s)"
  docuseal_hmac_header="$(
    python3 -c 'import hashlib,hmac,sys; key,timestamp,body=sys.stdin.read().splitlines(); print(hmac.new(key.encode(),(timestamp+"."+body).encode(),hashlib.sha256).hexdigest())' \
      <<<"${docuseal_hmac}"$'\n'"${docuseal_timestamp}"$'\n'"${docuseal_body}"
  )"
  [[ "$(
    curl -sS -o /dev/null -w '%{http_code}' \
      -X POST \
      -H 'Content-Type: application/json' \
      -H "x-docuseal-signature: ${docuseal_timestamp}.${docuseal_hmac_header}" \
      --data-binary "$docuseal_body" \
      "$DOCUSEAL_WEBHOOK_URL"
  )" == "200" ]]

  unset square_signature square_hmac square_body docuseal_hmac docuseal_body docuseal_timestamp docuseal_hmac_header
  echo "Sandbox deployment and signed webhook verification passed."
)

fortress_status=0
fortress_deploy_billing_sandbox || fortress_status=$?

# Clear the previously authorized one-time transport material from the current
# CloudShell session even when deployment fails.
unset SQUARE_TOKEN DOCUSEAL_TOKEN ADMIN_PASSWORD BILLING_SECRET
unset SQUARE_WEBHOOK_TEMP DOCUSEAL_WEBHOOK_TEMP SECRET_JSON
unset ACCOUNT_ID SECRET_ARN TRUST POLICY ROLE_ARN
rm -f /tmp/fortress-token.pem
unset -f fortress_deploy_billing_sandbox

if ((fortress_status != 0)); then
  echo "Sandbox deployment stopped with status ${fortress_status}; temporary CloudShell material was still cleared." >&2
  return "$fortress_status" 2>/dev/null || exit "$fortress_status"
fi

unset fortress_status
echo "Temporary CloudShell token variables and the one-time transport key were removed."
