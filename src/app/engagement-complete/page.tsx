import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
export const metadata: Metadata = { title: "Engagement Signed", robots: { index: false, follow: false } };
export default function EngagementCompletePage() { return <Section tone="paper"><div className="mx-auto max-w-2xl text-center"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent-ink)]">Signature received</p><h1 className="display mt-4 t-h1">Your engagement is underway.</h1><p className="mt-5 text-[var(--muted)]">A completed copy will be sent for your records. Fortress will issue the itemized Square invoice automatically after all required signatures are complete.</p></div></Section>; }
