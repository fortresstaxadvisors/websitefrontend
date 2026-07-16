import "server-only";
import { getRuntimeSecrets } from "@/lib/runtime-secrets";

async function settings() { const base = (process.env.DOCUSEAL_BASE_URL || "").replace(/\/$/, ""); const { DOCUSEAL_API_TOKEN: token } = await getRuntimeSecrets(); if (!base) throw new Error("DocuSeal is not configured"); return { base, token }; }
export async function docusealFetch<T>(path: string, init: RequestInit = {}) { const { base, token } = await settings(); const response = await fetch(`${base}${path}`, { ...init, cache: "no-store", headers: { "X-Auth-Token": token, Accept: "application/json", "Content-Type": "application/json", ...init.headers } }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || data.message || `DocuSeal request failed (${response.status})`); return data as T; }
