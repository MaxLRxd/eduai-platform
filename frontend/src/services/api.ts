import { getAccessToken, setAccessToken } from "./authToken";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    setAccessToken(null);
    return null;
  }
  const data = (await res.json()) as { accessToken?: string };
  if (!data.accessToken) {
    setAccessToken(null);
    return null;
  }
  setAccessToken(data.accessToken);
  return data.accessToken;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const doRequest = (token: string | null, retried: boolean): Promise<T> => {
    const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
    if (!(init?.body instanceof FormData)) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" }).then(
      async (res) => {
        if (res.status === 401 && !retried) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            return doRequest(newToken, true);
          }
        }
        if (!res.ok) {
          const text = await res.text();
          throw new ApiError(res.status, text || res.statusText);
        }
        return res.json() as Promise<T>;
      }
    );
  };
  return doRequest(getAccessToken(), false);
}

export async function getHealth(): Promise<{ status: string }> {
  return api<{ status: string }>("/api/healthz");
}
