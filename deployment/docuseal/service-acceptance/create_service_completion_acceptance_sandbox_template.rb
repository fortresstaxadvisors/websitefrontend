# frozen_string_literal: true

# Run inside the DocuSeal 3.1.4 Rails container with:
#   FORTRESS_TEMPLATE_AUTHOR_EMAIL=operator@example.test \
#   FORTRESS_TEMPLATE_PDF=/tmp/service-completion-acceptance-sandbox.pdf \
#   FORTRESS_TEMPLATE_MANIFEST=/tmp/service-completion-acceptance-sandbox-fields.json \
#   /app/bin/rails runner /tmp/create_service_completion_acceptance_sandbox_template.rb

require "json"

external_id = ENV.fetch(
  "FORTRESS_TEMPLATE_EXTERNAL_ID",
  "fortress-service-completion-acceptance-sandbox-v1"
)
name = "Fortress Service Completion Acknowledgment - SANDBOX ONLY"
pdf_path = ENV.fetch("FORTRESS_TEMPLATE_PDF")
manifest = JSON.parse(File.read(ENV.fetch("FORTRESS_TEMPLATE_MANIFEST")))
author = User.find_by!(email: ENV.fetch("FORTRESS_TEMPLATE_AUTHOR_EMAIL"))

raise "Sandbox manifest must contain exactly the Client role" unless manifest.fetch("roles") == ["Client"]
raise "Sandbox PDF is missing" unless File.file?(pdf_path)

template = Template.find_or_initialize_by(external_id: external_id)
created = template.new_record?

if created
  template.assign_attributes(
    name: name,
    shared_link: false,
    account: author.account,
    author: author,
    folder: TemplateFolders.find_or_create_by_name(author, "Default")
  )
  Templates.maybe_assign_access(template)
  template.save!
elsif template.submissions.pending.exists?
  raise "Refusing to replace a template that has active submissions"
end

file = File.open(pdf_path, "rb")
upload = ActionDispatch::Http::UploadedFile.new(
  tempfile: file,
  filename: File.basename(pdf_path),
  type: "application/pdf"
)

documents = if created || template.schema.blank?
              Templates::CreateAttachments.call(
                template,
                { files: [upload] },
                extract_fields: false
              ).first
            else
              Templates::ReplaceAttachments.call(
                template,
                { files: [upload] },
                extract_fields: false
              )
            end
file.close

document = documents.fetch(0)
schema = [{ attachment_uuid: document.uuid, name: document.filename.base }]
submitter = { "name" => "Client", "uuid" => SecureRandom.uuid }

fields = manifest.fetch("fields").map do |field|
  options = Array(field["options"]).map do |value|
    { "uuid" => SecureRandom.uuid, "value" => value }
  end
  {
    "uuid" => SecureRandom.uuid,
    "submitter_uuid" => submitter.fetch("uuid"),
    "name" => field.fetch("name"),
    "type" => field.fetch("type"),
    "required" => field.fetch("required"),
    "readonly" => field.fetch("readonly"),
    "prefillable" => field.fetch("prefillable"),
    "preferences" => {},
    **(options.empty? ? {} : { "options" => options }),
    "areas" => field.fetch("areas").map do |area|
      area.merge("uuid" => SecureRandom.uuid, "attachment_uuid" => document.uuid)
    end
  }
end

preferences = template.preferences.to_h.merge(
  "require_email_2fa" => true,
  "require_phone_2fa" => false,
  "submitters_order" => "preserved"
)

template.update!(
  name: name,
  shared_link: false,
  schema: schema,
  submitters: [submitter],
  fields: fields,
  preferences: preferences
)
SearchEntries.enqueue_reindex(template)

expected_fields = [
  "Client Name",
  "Client Company",
  "Invoice Number",
  "Completion Record ID",
  "Service or Milestone",
  "Delivery Date",
  "Delivery Method",
  "Delivered To",
  "Completed Deliverables",
  "Client Response",
  "Client Comments or Issue Description",
  "Client Rights Initials",
  "Client Printed Legal Name",
  "Client Signer Title",
  "Client Signature",
  "Client Signature Date"
]
actual_fields = template.reload.fields.map { |field| field.fetch("name") }
missing_fields = expected_fields - actual_fields
unexpected_fields = actual_fields - expected_fields

raise "Template fields are missing: #{missing_fields.join(', ')}" if missing_fields.any?
raise "Template fields are unexpected: #{unexpected_fields.join(', ')}" if unexpected_fields.any?
raise "Template role is invalid" unless template.submitters.pluck("name") == ["Client"]
raise "Email 2FA is not enabled" unless template.preferences["require_email_2fa"] == true
raise "Shared-link signing must remain disabled" unless template.shared_link == false

puts(
  {
    created: created,
    id: template.id,
    name: template.name,
    external_id: template.external_id,
    shared_link: template.shared_link,
    require_email_2fa: template.preferences["require_email_2fa"],
    roles: template.submitters.pluck("name"),
    field_count: actual_fields.length,
    fields: actual_fields.sort
  }.to_json
)
