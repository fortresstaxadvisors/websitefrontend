"use client";

import { useEffect, useState } from "react";

type Artifact = { sha256: string; size: number; contentType: string };
type ChecklistItem = { id: string; label: string; required: boolean; status: "MISSING" | "READY" | "EXCLUDED"; evidenceType?: string; artifact?: Artifact; note?: string };
type DisputeCase = {
  disputeId: string; squareState: string; reason: string; paymentId: string; invoiceNumber?: string;
  amount: number; currency: string; squareDueAt?: string; internalDueAt: string; summary: string;
  localState: string; ownerUserId?: string; backupOwnerUserId?: string; checklist: ChecklistItem[];
  review?: { reviewedBy: string; reviewedAt: string; manifestHash: string };
  submission?: { submittedBy: string; submittedAt: string; squareEvidenceIds: string[] };
  version: number; updatedAt: string;
};
type SquareDispute = { id: string; state: string; reason: string; amount: number; dueAt?: string };
const inputClass = "mt-2 w-full rounded-lg border border-[var(--line-strong)] bg-white px-3 py-2 text-base outline-none focus:border-[var(--accent-ink)] sm:text-sm";
function toLocalDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

async function jsonAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/internal/disputes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not update dispute case");
  return data.case as DisputeCase;
}

function EvidenceRow({ record, item, onChanged }: { record: DisputeCase; item: ChecklistItem; onChanged: (record: DisputeCase) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function upload() {
    if (!file || !confirmed) return;
    setBusy(true); setNotice("");
    try {
      const form = new FormData();
      form.set("disputeId", record.disputeId); form.set("itemId", item.id); form.set("version", String(record.version));
      form.set("confirmed", "yes"); form.set("file", file);
      const response = await fetch("/api/internal/disputes/evidence", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not upload evidence");
      setFile(null); setConfirmed(false); setNotice("Archived and integrity-checked."); onChanged(data.case);
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : "Could not upload evidence"); }
    finally { setBusy(false); }
  }
  return (
    <li className="rounded-lg border border-[var(--line)] bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2"><strong className="text-sm">{item.label}{item.required ? " *" : ""}</strong><span className={`rounded-full px-2 py-1 text-[0.65rem] font-bold uppercase ${item.status === "READY" ? "bg-emerald-100 text-emerald-900" : item.status === "EXCLUDED" ? "bg-stone-100 text-stone-700" : "bg-amber-100 text-amber-950"}`}>{item.status.toLowerCase()}</span></div>
      {item.note ? <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.note}</p> : null}
      {item.artifact ? <p className="mt-2 text-xs text-[var(--faint)]">{(item.artifact.size / 1024).toFixed(0)} KB · SHA-256 {item.artifact.sha256.slice(0, 12)}… · <a className="underline" href={`/api/internal/disputes/evidence?disputeId=${encodeURIComponent(record.disputeId)}&itemId=${encodeURIComponent(item.id)}`}>review file</a></p> : null}
      {!record.submission && !["PROCESSING", "WON", "LOST", "ACCEPTED", "CLOSED"].includes(record.localState) ? <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-xs font-semibold">{item.artifact ? "Replace file" : "Upload evidence"}<input className={inputClass} type="file" accept="application/pdf,image/jpeg,image/png,image/tiff,image/heic,image/heif" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><button type="button" disabled={!file || !confirmed || busy} onClick={() => void upload()} className="btn btn-secondary min-h-11 justify-center disabled:opacity-40">{busy ? "Archiving…" : "Archive file"}</button><label className="flex items-start gap-2 text-xs leading-5 text-[var(--muted)] sm:col-span-2"><input className="mt-1" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />I reviewed this file and removed unrelated tax data, SSNs, bank numbers, passwords, and other unnecessary sensitive information.</label></div> : null}
      {notice ? <p role="status" className="mt-2 text-xs font-semibold">{notice}</p> : null}
    </li>
  );
}

function CaseCard({ initial, onChanged }: { initial: DisputeCase; onChanged: (record: DisputeCase) => void }) {
  const [record, setRecord] = useState(initial);
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState(initial.ownerUserId || "");
  const [backup, setBackup] = useState(initial.backupOwnerUserId || "");
  const [summary, setSummary] = useState(initial.summary);
  const [deadline, setDeadline] = useState(toLocalDateTime(initial.internalDueAt));
  const [submissionAttested, setSubmissionAttested] = useState(false);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  const apply = (next: DisputeCase) => { setRecord(next); onChanged(next); };
  useEffect(() => { setRecord(initial); setOwner(initial.ownerUserId || ""); setBackup(initial.backupOwnerUserId || ""); setSummary(initial.summary); setDeadline(toLocalDateTime(initial.internalDueAt)); }, [initial]);
  async function action(payload: Record<string, unknown>) {
    setBusy(true); setNotice("");
    try { apply(await jsonAction({ disputeId: record.disputeId, version: record.version, ...payload })); setNotice("Case updated from authoritative records."); }
    catch (cause) { setNotice(cause instanceof Error ? cause.message : "Could not update dispute case"); }
    finally { setBusy(false); }
  }
  const missingRequired = record.checklist.filter((item) => item.required && item.status !== "READY").length;
  const days = record.squareDueAt ? Math.ceil((Date.parse(record.squareDueAt) - Date.now()) / 86_400_000) : undefined;
  return (
    <article className="rounded-xl border border-red-800/25 bg-red-50 p-4 text-red-950">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex min-h-11 w-full items-start justify-between gap-4 text-left"><span><strong>{record.reason.replaceAll("_", " ").toLowerCase()}</strong><span className="mt-1 block text-xs">Fortress: {record.localState.replaceAll("_", " ").toLowerCase()} · Square: {record.squareState.replaceAll("_", " ").toLowerCase()}</span></span><span className="text-xs font-semibold">{open ? "Close" : "Open case"}</span></button>
      <p className="mt-1 text-sm">{record.invoiceNumber ? `${record.invoiceNumber} · ` : ""}${(record.amount / 100).toFixed(2)} {record.currency}{record.squareDueAt ? ` · Square deadline ${new Date(record.squareDueAt).toLocaleString()}${days !== undefined ? ` (${days} days)` : ""}` : ""}</p>
      <p className="mt-1 break-all font-mono text-xs">{record.disputeId}</p>
      {open ? <div className="mt-4 space-y-4 border-t border-red-900/15 pt-4">
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Primary owner *<input className={inputClass} value={owner} onChange={(event) => setOwner(event.target.value)} maxLength={191} placeholder="Named staff member" /></label><label className="text-xs font-semibold">Backup owner *<input className={inputClass} value={backup} onChange={(event) => setBackup(event.target.value)} maxLength={191} placeholder="Different named staff member" /></label><label className="text-xs font-semibold">Internal deadline *<input className={inputClass} type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label><label className="text-xs font-semibold sm:col-span-2">Case summary *<textarea className={inputClass} rows={3} minLength={20} maxLength={2000} value={summary} onChange={(event) => setSummary(event.target.value)} /></label><button disabled={busy || owner.trim().length < 2 || backup.trim().length < 2 || owner.trim().toLowerCase() === backup.trim().toLowerCase() || summary.trim().length < 20 || !deadline} type="button" onClick={() => void action({ action: "assign", ownerUserId: owner, backupOwnerUserId: backup, summary, internalDueAt: new Date(deadline).toISOString() })} className="btn btn-secondary min-h-11 justify-center disabled:opacity-40 sm:col-span-2">Assign responsibility and deadline</button></div>
        <section><h5 className="text-sm font-semibold">Evidence checklist</h5><p className="mt-1 text-xs leading-5">Only relevant evidence belongs here. Each file is private, versioned, hash-checked, and limited to Square’s 5 MB per-file limit.</p><ol className="mt-3 space-y-2">{record.checklist.map((item) => <EvidenceRow key={item.id} record={record} item={item} onChanged={apply} />)}</ol></section>
        <div className="rounded-lg border border-red-900/15 bg-white p-3 text-sm"><p><strong>{missingRequired ? `${missingRequired} required evidence item${missingRequired === 1 ? "" : "s"} missing` : "Required evidence is ready for review"}</strong></p><p className="mt-1 text-xs leading-5">Fortress never submits evidence automatically. A staff reviewer must inspect the final files, then submit the approved response in Square Dashboard.</p>{record.localState === "READY_FOR_REVIEW" && record.review ? <label className="mt-3 flex items-start gap-2 rounded-lg border border-red-900/15 p-3 text-xs leading-5"><input className="mt-1" type="checkbox" checked={submissionAttested} onChange={(event) => setSubmissionAttested(event.target.checked)} />I attest that I submitted this exact locked evidence set in Square and did not substitute, omit, or add files after review.</label> : null}<div className="mt-3 flex flex-wrap gap-2"><a href="https://app.squareup.com/dashboard/disputes" target="_blank" rel="noreferrer" className="btn btn-secondary">Open Square disputes</a><button type="button" disabled={busy} onClick={() => void action({ action: "sync", confirmed: true })} className="btn btn-secondary disabled:opacity-40">Sync Square state</button>{record.localState === "PREPARING" || (record.localState === "READY_FOR_REVIEW" && !record.review) ? <button type="button" disabled={busy || missingRequired > 0 || !record.ownerUserId} onClick={() => void action({ action: "ready", confirmed: true })} className="btn btn-secondary disabled:opacity-40">Lock reviewed evidence manifest</button> : null}{record.localState === "READY_FOR_REVIEW" && record.review ? <button type="button" disabled={busy || !submissionAttested} onClick={() => void action({ action: "record_submission", confirmed: true, attestedExactFiles: true })} className="btn btn-secondary disabled:opacity-40">Attest and record Square submission</button> : null}{["WON", "LOST", "ACCEPTED"].includes(record.localState) ? <button type="button" disabled={busy} onClick={() => void action({ action: "close", confirmed: true, note: `Closed after verified ${record.localState.toLowerCase()} outcome.` })} className="btn btn-secondary disabled:opacity-40">Close resolved case</button> : null}</div></div>
        {record.submission ? <p className="rounded-lg border border-emerald-800/20 bg-emerald-50 p-3 text-sm text-emerald-950">Square evidence recorded {new Date(record.submission.submittedAt).toLocaleString()} · {record.submission.squareEvidenceIds.length} verified evidence item(s).</p> : null}
        {notice ? <p role="status" className="rounded-lg border border-red-900/15 bg-white p-3 text-sm font-semibold">{notice}</p> : null}
      </div> : null}
    </article>
  );
}

export function DisputeCasePanel({ refreshKey, squareDisputes }: { refreshKey: number; squareDisputes: SquareDispute[] }) {
  const [cases, setCases] = useState<DisputeCase[]>([]); const [error, setError] = useState(""); const [busyId, setBusyId] = useState("");
  async function load() { const response = await fetch("/api/internal/disputes", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not load dispute cases"); setCases(data.cases || []); }
  useEffect(() => { let active = true; setError(""); void fetch("/api/internal/disputes", { cache: "no-store" }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not load dispute cases"); if (active) setCases(data.cases || []); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load dispute cases"); }); return () => { active = false; }; }, [refreshKey]);
  const tracked = new Set(cases.map((item) => item.disputeId)); const untracked = squareDisputes.filter((item) => !tracked.has(item.id));
  async function sync(id: string) { setBusyId(id); setError(""); try { await jsonAction({ disputeId: id, action: "sync", confirmed: true }); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create dispute case"); } finally { setBusyId(""); } }
  return <section id="disputes" className="space-y-3" aria-label="Fortress dispute response cases">{error ? <p className="rounded-xl border border-red-800/25 bg-red-50 p-3 text-sm text-red-950">{error}</p> : null}{untracked.map((item) => <article key={item.id} className="rounded-xl border border-red-800/25 bg-red-50 p-4 text-sm text-red-950"><strong>Square dispute is not yet in the Fortress response queue</strong><p className="mt-1">{item.reason.replaceAll("_", " ").toLowerCase()} · ${(item.amount / 100).toFixed(2)} · {item.state.replaceAll("_", " ").toLowerCase()}</p><button disabled={busyId === item.id} onClick={() => void sync(item.id)} type="button" className="btn btn-secondary mt-3 disabled:opacity-40">Create verified response case</button></article>)}{cases.map((record) => <CaseCard key={record.disputeId} initial={record} onChanged={(next) => setCases((items) => items.map((item) => item.disputeId === next.disputeId ? next : item))} />)}{!cases.length && !untracked.length ? <p className="rounded-xl border border-dashed border-[var(--line-strong)] p-4 text-sm text-[var(--muted)]">No active or historical dispute cases are recorded.</p> : null}</section>;
}
