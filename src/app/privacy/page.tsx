import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui";
import { Prose } from "@/components/prose";

/*
  Privacy Policy — Wave-0 legal/prose styling.

  Scope note: this version is written to also cover the forthcoming Fortress
  Client Portal (account creation, onboarding, secure document upload and
  exchange, viewing of tax information, and advisory coordination). The portal
  is a FUTURE product — provisions about it are framed as applying "when and as
  the portal is made available" / "if you are granted access," so nothing here
  claims a live, functioning portal today.
*/

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Fortress Tax Advisors collects, uses, shares, and safeguards personal, financial, and tax information across our website and the forthcoming Fortress Client Portal.",
  alternates: { canonical: "/privacy" },
  // Keep legal pages out of search until final publishing inputs are confirmed.
  robots: { index: false, follow: true },
};

// The policy body. Rendered via <Prose> so it inherits the editorial body
// treatment (measured column, tabular figures, section headings).
const PRIVACY_BODY = `This Privacy Policy explains how Fortress Tax Advisors ("Fortress," "we," "us," or "our") collects, uses, discloses, retains, and safeguards information when you visit our website, contact us, engage us for professional services, or use the Fortress Client Portal and related digital tools (together, the "Services"). By using the Services, you acknowledge the practices described here.

It applies to information processed in connection with this website and the forthcoming Fortress Client Portal — the secure operating layer being built for onboarding, document exchange, engagement visibility, and ongoing advisory coordination. Portal-specific practices apply when and as the portal is made available to you.

## Scope and your acceptance

This policy governs personal, business, financial, and tax information processed through the Services. It does not alter the terms of any signed engagement letter, which controls the professional relationship. Where this policy and an executed engagement letter or a separate data processing or confidentiality agreement conflict, that signed agreement controls. Your continued use of the Services after a change to this policy constitutes acceptance of the updated policy.

## Information we collect

We collect information in several ways:

- **Information you provide directly.** Your name, organization, role, email, phone, mailing address, and the description of your situation you share when you contact us, request a consultation, or complete onboarding. During an engagement and through the Client Portal, this includes the financial, accounting, and tax information necessary to perform the work — which may include tax returns and supporting workpapers, financial statements, entity and ownership details, banking and transaction records, identifiers such as taxpayer or employer identification numbers, and similar materials about you, your entities, and individuals connected to an engagement.
- **Information about others that you submit.** If you provide information about your owners, beneficiaries, employees, family members, or other related parties, you represent that you are authorized to provide it for the purposes described here.
- **Account and authentication data.** When the Client Portal is available, information used to create and secure an account — such as login credentials, multi-factor authentication details, and access logs.
- **Information collected automatically.** When you use the Services, we and our service providers may collect device, browser, IP address, usage, and diagnostic information through cookies and similar technologies, including for security, fraud prevention, and to operate and improve the Services.
- **Information from third parties.** We may receive information from your other advisors, financial institutions, taxing authorities, identity-verification providers, or referral sources, where permitted by law and consistent with any engagement.

We do not knowingly collect information from children, and the Services are not directed to them.

## How we use information

We use information to: respond to inquiries and evaluate fit; establish and verify your identity and account; perform onboarding; scope, deliver, document, and support professional services; prepare and review filings and advisory work product; communicate with you and coordinate with your other advisors; operate, maintain, secure, monitor, and improve the website and Client Portal; detect, investigate, and prevent fraud, abuse, and security incidents; comply with professional standards and our legal, regulatory, and recordkeeping obligations; and establish, exercise, or defend legal claims. **We do not sell personal information, and we do not share it for cross-context behavioral advertising.**

## How we share information

We do not disclose your information except as described here:

- **Service providers and processors.** We use vetted third-party providers — including secure hosting, cloud storage, document-exchange and portal infrastructure, identity verification, email and communications, and practice and tax software — to operate the Services. They may process information only on our instructions and for the purposes we specify.
- **With your direction.** We share information with your other advisors, financial institutions, or counterparties when you instruct us to, or as reasonably necessary to carry out an engagement.
- **Legal and regulatory.** We may disclose information to comply with applicable law, professional obligations, a subpoena, court order, or lawful government or regulatory request, or to protect the rights, property, safety, or integrity of Fortress, our clients, or others.
- **Business transfers.** Information may be transferred as part of a merger, acquisition, financing, reorganization, or sale of assets, subject to customary protections.

## Service providers and the Client Portal

The Client Portal and document-exchange features rely on third-party infrastructure and software providers. While we select providers we consider reputable and require appropriate safeguards, your information is also subject to those providers' own terms and security practices, and we are not responsible for the independent acts or omissions of any third party. No method of transmission or electronic storage is completely secure, and we cannot guarantee absolute security.

## Security

We maintain administrative, technical, and physical safeguards designed to protect information appropriate to its sensitivity, including access controls, limited-access practices, and encryption in transit. You are responsible for safeguarding your own credentials and devices, for keeping your contact and account information accurate, and for promptly notifying us of any suspected unauthorized access. Despite reasonable safeguards, no system is impenetrable, and we cannot warrant that information will be secure under all circumstances.

## Data retention

We retain information for as long as needed to provide the Services, maintain our client relationships, and satisfy professional, contractual, tax, and other legal recordkeeping obligations, after which we take reasonable steps to delete, de-identify, or archive it. Retention periods reflect the nature of the records and applicable requirements.

## Your choices and rights

You may ask us to access, correct, or update information we hold about you, request deletion, or ask that we stop sending you non-essential communications. Depending on your jurisdiction, you may have additional rights, and we will honor applicable rights to the extent required by law. Some information must be retained where a professional, contractual, tax, or legal obligation applies, and certain features of the Services may not function without necessary information. To exercise a request, contact us through our Contact page; we may need to verify your identity before responding.

## Confidentiality and professional obligations

Information you share in connection with professional services is treated as confidential and handled consistent with applicable professional standards and any confidentiality provisions of your engagement letter. This policy supplements — and does not waive or limit — those obligations.

## Third-party links and services

The Services may link to or integrate with third-party websites and tools that we do not control. Their privacy practices are governed by their own policies, and we are not responsible for them.

## Changes to this policy

We may update this policy from time to time. The current version will be posted here with a revised effective date, and material changes will take effect as permitted by law. Your continued use of the Services after an update constitutes acceptance of the revised policy.

## Contact

Questions about this policy, or requests regarding your information, can be directed to Fortress Tax Advisors through our Contact page.`;

export default function PrivacyPage() {
  return (
    <>
      <Section tone="paper" as="div">
        <div className="measure">
          <SectionHeader
            as="h1"
            eyebrow="Legal"
            title="Privacy Policy"
            opener
          />

          <p className="mt-8 text-sm text-[var(--faint)]">
            This policy describes how Fortress Tax Advisors handles information
            across our website, our inquiries and engagements, and the
            forthcoming Fortress Client Portal.
          </p>

          <div className="mt-10">
            <Prose content={PRIVACY_BODY} />
          </div>

          <p className="mt-12 border-t border-[var(--line)] pt-6 text-sm leading-7 text-[var(--muted)]">
            Fortress Tax Advisors is a licensed CPA firm. This website is for
            general information and does not, by itself, create an advisory or
            client relationship. The exact terms of any engagement are set out
            in a signed engagement letter.
          </p>
        </div>
      </Section>
    </>
  );
}
