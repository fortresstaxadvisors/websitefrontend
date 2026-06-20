import type { Metadata } from "next";
import { Section, SectionHeader, Eyebrow } from "@/components/ui";
import { Prose } from "@/components/prose";
import { Reveal } from "@/components/reveal";

/*
  Terms of Use — Wave-0 legal/prose styling. DRAFT pending legal review
  (visible notice + a real HTML comment in the markup).

  Scope note: written to also govern the forthcoming Fortress Client Portal
  (account registration, onboarding, secure document upload/exchange, viewing
  of tax information, secure messaging, and advisory coordination). The portal
  is a FUTURE product — portal provisions apply "when and as made available" /
  "if you are granted access," so nothing here represents a live, functioning
  portal today. Drafted defensively for maximum protection of the firm:
  acceptable-use, account/security, electronic-records, disclaimers,
  limitation of liability, indemnification, suspension, and governing law.
  Truthful: Fortress is a licensed CPA firm, not a law firm; the professional
  relationship is governed by a signed engagement letter, which controls.
  Final language must be confirmed by counsel; bracketed items need input.
*/

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms governing use of the Fortress Tax Advisors website and the forthcoming Fortress Client Portal, including acceptable use, accounts, disclaimers, and limitation of liability. Engagements are governed by a signed engagement letter. Draft pending legal review.",
  alternates: { canonical: "/terms" },
  // Drafts should not yet be surfaced in search results.
  robots: { index: false, follow: true },
};

// The draft body. Rendered via <Prose>.
const TERMS_BODY = `These Terms of Use ("Terms") govern your access to and use of the website of Fortress Tax Advisors ("Fortress," "we," "us," or "our"), the Fortress Client Portal, and any related digital tools, content, and features (together, the "Services"). By accessing or using the Services, you agree to these Terms. If you do not agree, do not use the Services. If you use the Services on behalf of an entity, you represent that you are authorized to bind that entity to these Terms.

The content on the Services is provided for general informational purposes only and does not by itself establish an advisory or client relationship. Formal services are governed by a signed engagement letter, which controls.

## Informational use only — not advice

The content on the Services — including articles, insights, descriptions of our services, tools, calculators, and any information displayed in the Client Portal — is provided for general informational purposes. It is not tax, legal, accounting, investment, or other professional advice, is not a substitute for advice tailored to your specific facts, and may not reflect the most current developments. You should not act or refrain from acting based on it without obtaining advice from a qualified professional engaged for that purpose. Any information presented in the Client Portal is provided for your convenience and reference and does not constitute a filing, an opinion, or a deliverable unless expressly identified as such in your engagement.

## No advisory relationship; engagement letter controls

Using the Services, contacting us through them, requesting a consultation, creating a portal account, or submitting documents does not by itself create an advisory, fiduciary, or client relationship. A professional relationship is established only when Fortress and the client sign an engagement letter that defines the scope, terms, fees, and responsibilities of the work. **In the event of any conflict between these Terms and a signed engagement letter, the engagement letter controls the professional services; these Terms otherwise govern your use of the Services.**

## Scope of the firm

Fortress Tax Advisors is a licensed CPA firm. **Fortress is not a law firm and does not provide legal advice.** Where a matter calls for legal counsel, we coordinate with your attorneys or recommend that you engage them.

## Eligibility and accounts

Portions of the Services, including the Client Portal, require an account and are available only to authorized clients and invited users when and as the portal is made available. You agree to provide accurate, current, and complete information, to keep it updated, and to use the Services only for lawful purposes and in accordance with these Terms and any instructions we provide. We may decline, suspend, or terminate access at our discretion.

## Account security and your responsibilities

If you are granted access to the Client Portal, you are responsible for maintaining the confidentiality of your credentials and any multi-factor authentication, for all activity that occurs under your account, and for the security of the devices you use. You agree to use strong credentials, to enable any required security measures, and to notify us promptly of any suspected unauthorized access or security incident. We are not liable for any loss arising from unauthorized use of your account that results from your failure to safeguard your credentials.

## Documents and submissions; accuracy of your information

You may upload, transmit, or store documents and information through the Services ("Your Content"). You represent and warrant that you have the right to provide Your Content, that it does not infringe or violate any third-party right or applicable law, and that it is, to the best of your knowledge, accurate and complete. **You are solely responsible for the accuracy, completeness, and timeliness of the information and documents you submit, and Fortress is entitled to rely on them without independent verification unless your engagement expressly provides otherwise.** You retain ownership of Your Content. You grant Fortress a limited license to host, process, transmit, and use Your Content as necessary to operate the Services and perform any engagement. You are responsible for maintaining your own copies of Your Content; the Services are not a system of record or a substitute for your own retention. We may set limits on file types, sizes, and storage, and may remove content that violates these Terms.

## Acceptable use

You agree not to: use the Services for any unlawful, fraudulent, or unauthorized purpose; upload malware or harmful code; attempt to gain unauthorized access to the Services, other accounts, or our systems or networks; interfere with or disrupt the integrity or performance of the Services; reverse engineer, scrape, or copy the Services except as permitted by law; misrepresent your identity or authority; or use the Services to infringe the rights of others. We may investigate and take action, including suspension or termination and referral to authorities, for any suspected violation.

## Electronic communications, records, and signatures

You consent to receive communications, disclosures, and records from us electronically, and you agree that electronic communications, records, and signatures satisfy any legal requirement that such items be in writing, to the extent permitted by law. Document delivery, acknowledgments, and any e-signature features within the Services are provided for convenience; the legal effect of any signed document is governed by that document and applicable law.

## Third-party services

The Services rely on and may link to or integrate with third-party providers and platforms (including hosting, cloud storage, document-exchange and portal infrastructure, identity verification, and software). We do not control, and are not responsible for, the availability, content, security, or practices of third parties, and your use of their services may be subject to their own terms. Links and integrations are provided for convenience and are not endorsements.

## Availability and changes to the Services

The Services, including the Client Portal, are offered on an as-available basis and remain under active development. We may add, change, suspend, limit, or discontinue any part of the Services at any time, with or without notice, and we are not liable for any modification, suspension, or discontinuation. We do not guarantee that the Services will be uninterrupted, error-free, or available at any particular time.

## Intellectual property

The Services and their content, design, software, trademarks, logos, and brand elements are owned by Fortress or its licensors and are protected by law. We grant you a limited, revocable, non-exclusive, non-transferable license to access and use the Services for their intended purpose. You may not copy, modify, distribute, sell, license, or create derivative works from the Services except as expressly permitted. All rights not expressly granted are reserved.

## Disclaimers

THE SERVICES AND ALL CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY. TO THE FULLEST EXTENT PERMITTED BY LAW, FORTRESS DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT, AND ANY WARRANTY THAT THE SERVICES WILL BE SECURE, UNINTERRUPTED, ERROR-FREE, OR THAT CONTENT IS ACCURATE, COMPLETE, OR CURRENT. NO ADVICE OR INFORMATION OBTAINED THROUGH THE SERVICES CREATES ANY WARRANTY NOT EXPRESSLY STATED HERE. This section does not limit warranties that cannot be excluded under applicable law, and nothing in these Terms limits the firm's professional obligations under a signed engagement.

## Limitation of liability

TO THE FULLEST EXTENT PERMITTED BY LAW, FORTRESS AND ITS PARTNERS, MEMBERS, OFFICERS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICES, WHETHER BASED IN CONTRACT, TORT, OR ANY OTHER THEORY, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. TO THE FULLEST EXTENT PERMITTED BY LAW, THE TOTAL AGGREGATE LIABILITY OF FORTRESS ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICES WILL NOT EXCEED [one hundred U.S. dollars (US$100)]. These limitations apply to your use of the Services and do not limit liability that cannot be excluded under applicable law; liability for professional services is governed by the applicable signed engagement letter.

## Indemnification

To the fullest extent permitted by law, you agree to indemnify, defend, and hold harmless Fortress and its partners, members, officers, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to your use of the Services, Your Content, your violation of these Terms, or your violation of any law or third-party right.

## Suspension and termination

We may suspend or terminate your access to the Services at any time, with or without notice, including for any suspected violation of these Terms or to protect the Services or other users. Upon termination, your right to use the Services ceases, though provisions that by their nature should survive — including ownership, disclaimers, limitation of liability, indemnification, and governing law — will survive.

## Governing law and disputes

These Terms are governed by the laws of [State / jurisdiction to be confirmed], without regard to its conflict-of-laws rules. You agree that any dispute relating to the Services will be subject to [the exclusive jurisdiction and venue / the dispute-resolution process] to be specified here, except where a signed engagement letter provides a controlling dispute-resolution provision.

## Changes to these Terms

We may update these Terms from time to time. The current version will be posted here with a revised effective date, and your continued use of the Services after an update constitutes acceptance of the revised Terms.

## Severability and entire agreement

If any provision of these Terms is held unenforceable, the remaining provisions remain in effect. These Terms, together with our Privacy Policy and any applicable signed engagement letter, constitute the entire agreement regarding your use of the Services.

## Contact

Questions about these Terms can be directed to Fortress Tax Advisors through our Contact page.`;

export default function TermsPage() {
  return (
    <>
      {/* DRAFT — PENDING LEGAL REVIEW. Do not treat as final, binding terms. */}
      {/* Also emit a real HTML comment into the served markup (the JSX comment
          above is stripped by React and never reaches the page source). */}
      <div
        hidden
        aria-hidden="true"
        dangerouslySetInnerHTML={{
          __html:
            "<!-- DRAFT — PENDING LEGAL REVIEW: Terms of Use. Not reviewed by counsel; not final or binding. -->",
        }}
      />
      <Section tone="paper" as="div">
        <div className="measure">
          <SectionHeader as="h1" eyebrow="Legal" title="Terms of Use" opener />

          <Reveal kind="rise">
            <DraftNotice />
          </Reveal>

          <p className="mt-8 text-sm text-[var(--faint)]">
            These terms govern your use of the Fortress Tax Advisors website and
            the forthcoming Fortress Client Portal. By using the Services, you
            agree to them.
          </p>

          <div className="mt-10">
            <Prose content={TERMS_BODY} />
          </div>

          <p className="mt-12 border-t border-[var(--line)] pt-6 text-sm leading-7 text-[var(--muted)]">
            Formal services are governed by a signed engagement letter, which
            controls in the event of any conflict with the general information
            on this site.
          </p>
        </div>
      </Section>
    </>
  );
}

/** The prominent "draft pending legal review" notice shared by legal pages. */
function DraftNotice() {
  return (
    <div
      role="note"
      className="panel mt-10 border-l-2 border-[var(--accent)] p-6 md:p-7"
    >
      <Eyebrow className="text-[var(--accent-ink)]">
        Draft — pending legal review
      </Eyebrow>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
        This document is a working draft published for internal review. It has
        not yet been reviewed or approved by counsel and should not be relied
        upon as final, binding terms. Final language will be confirmed before
        launch.
      </p>
    </div>
  );
}
