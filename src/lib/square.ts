import "server-only";
import { getRuntimeSecrets } from "@/lib/runtime-secrets";

export const SQUARE_VERSION = "2026-05-20";

async function config() {
  const { SQUARE_ACCESS_TOKEN: token } = await getRuntimeSecrets();
  return {
    token,
    base: process.env.SQUARE_ENVIRONMENT === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com",
  };
}

export async function squareFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { token, base } = await config();
  const response = await fetch(`${base}${path}`, {
    ...init,
    cache: "no-store",
    signal: init.signal || AbortSignal.timeout(20_000),
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": SQUARE_VERSION,
      Accept: "application/json",
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });
  const data = (await response.json()) as T & { errors?: { detail?: string; code?: string }[] };
  if (!response.ok) {
    const detail = data.errors?.map((error) => error.detail || error.code).filter(Boolean).join("; ");
    throw new Error(detail || `Square request failed (${response.status})`);
  }
  return data;
}

export function squareLocationId() {
  const id = process.env.SQUARE_LOCATION_ID;
  if (!id) throw new Error("SQUARE_LOCATION_ID is not configured");
  return id;
}
