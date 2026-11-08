import { auth } from "@clerk/nextjs/server";

export async function getAuthHeaders(): Promise<HeadersInit> {
  const { getToken } = await auth();
  const token = await getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function fetchFromApi(path: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const url = `${process.env.NEXT_PUBLIC_API_URL || ''}${path}`;
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
    cache: 'no-store',
  });
}

export async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetchFromApi(path, options);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API Error: ${res.status} ${error}`);
  }
  return res.json();
}