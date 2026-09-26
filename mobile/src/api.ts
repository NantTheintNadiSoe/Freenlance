import { getSession, setSession } from "./storage";
import { API_URL } from "./config";
import type { Contract, Job, ListMeta, Session, User } from "./types";

export class ApiError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string[]>;

  constructor(message: string, status: number, code?: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function refreshAccessToken() {
  const current = await getSession();
  if (!current?.refreshToken) return false;
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: current.refreshToken })
  });
  if (!response.ok) return false;
  const payload = (await response.json()) as { data: Pick<Session, "accessToken" | "refreshToken"> };
  await setSession({ ...current, ...payload.data });
  return true;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const current = await getSession();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (current?.accessToken) headers.set("Authorization", `Bearer ${current.accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(`Could not reach Archer at ${API_URL}. Check that the API is running and that the device can reach your computer.`, 0, "NETWORK_ERROR");
  }

  if (response.status === 401 && retry && await refreshAccessToken()) {
    return apiFetch<T>(path, options, false);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string; code?: string; fields?: Record<string, string[]> } } | null;
    throw new ApiError(body?.error?.message ?? "Something went wrong", response.status, body?.error?.code, body?.error?.fields);
  }

  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const api = {
  login: (body: { email: string; password: string }) => apiFetch<{ data: Session }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body: { email: string; password: string; displayName: string; role: "CLIENT" | "FREELANCER"; defaultCurrency: "USD" | "MMK" }) => apiFetch<{ data: Session }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  me: () => apiFetch<{ data: User }>("/auth/me"),
  logout: (refreshToken: string) => apiFetch<void>("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }, false),
  jobs: (query = "") => apiFetch<{ data: Job[]; meta: ListMeta }>(`/jobs${query}`),
  job: (id: string) => apiFetch<{ data: Job }>(`/jobs/${id}`),
  createProposal: (jobId: string, body: { coverLetter: string; proposedAmountMinor: number; currency: string; estimatedDays: number }) => apiFetch(`/proposals/jobs/${jobId}`, { method: "POST", body: JSON.stringify(body) }),
  contracts: () => apiFetch<{ data: Contract[] }>("/contracts"),
  notifications: () => apiFetch<{ data: { id: string; title: string; body: string; readAt: string | null }[] }>("/notifications")
};