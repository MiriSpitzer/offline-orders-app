const ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL ?? "https://accounts.zoho.uk";
const API_URL = process.env.ZOHO_API_URL ?? "https://www.zohoapis.uk/inventory/v1";

let cachedToken: { token: string; expiresAt: number } | null = null;

export class ZohoUnreachableError extends Error {
  constructor() {
    super("Zoho is not reachable");
  }
}

async function fetchZoho(url: string | URL, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, cache: "no-store" });
  } catch {
    throw new ZohoUnreachableError();
  }
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const res = await fetchZoho(`${ACCOUNTS_URL}/oauth/v2/token`, {
    method: "POST",
    body: new URLSearchParams({
      refresh_token: env("REFRESH_TOKEN_ZOHO_INVENTORY"),
      client_id: env("ZOHO_CLIENT_ID"),
      client_secret: env("ZOHO_CLIENT_SECRET"),
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Zoho token refresh failed: ${data.error ?? res.status}`);
  }

  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

type ZohoRequest = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string>;
  body?: unknown;
};

export async function isZohoReachable(): Promise<boolean> {
  try {
    await fetch(ACCOUNTS_URL, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(5000) });
    return true;
  } catch {
    return false;
  }
}

export async function zohoFetch<T = any>(path: string, req: ZohoRequest = {}): Promise<T> {
  const url = new URL(API_URL + path);
  url.searchParams.set("organization_id", env("ZOHO_ORGANIZATION_ID"));
  for (const [key, value] of Object.entries(req.query ?? {})) url.searchParams.set(key, value);

  const res = await fetchZoho(url, {
    method: req.method ?? "GET",
    headers: {
      Authorization: `Zoho-oauthtoken ${await getAccessToken()}`,
      ...(req.body ? { "Content-Type": "application/json" } : {}),
    },
    body: req.body ? JSON.stringify(req.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(`Zoho ${path}: ${data.message ?? res.status}`);
  }
  return data;
}

export async function zohoFetchAll<T>(
  path: string,
  key: string,
  query: Record<string, string> = {}
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; ; page++) {
    const data = await zohoFetch(path, {
      query: { ...query, page: String(page), per_page: "200" },
    });
    all.push(...(data[key] as T[]));
    if (!data.page_context?.has_more_page) return all;
  }
}
