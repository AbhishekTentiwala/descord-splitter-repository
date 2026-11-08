import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function getAuthHeaders(token?: string): Promise<HeadersInit> {
  // If token is provided, use it
  if (token) {
    console.log("[API_SERVER] Using provided clerkToken, length:", token.length);
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
  }

  // Try to get token from Clerk auth (for server components with auth context)
  try {
    const { getToken } = await auth();
    const token = await getToken();
    if (token) {
      console.log("[API_SERVER] Got token from auth(), length:", token.length);
      return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };
    }
  } catch {
    // auth() not available in this context
  }

  // Fallback: Get Clerk session cookie from request headers
  try {
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie");
    if (cookieHeader) {
      // Extract Clerk session cookie
      const clerkSessionMatch = cookieHeader.match(/__session=([^;]+)/);
      if (clerkSessionMatch) {
        console.log("[API_SERVER] Using cookie auth");
        return {
          "Content-Type": "application/json",
          "Cookie": `__session=${clerkSessionMatch[1]}`,
        };
      }
    }
  } catch {
    // headers() not available
  }

  console.log("[API_SERVER] No auth available");
  return { "Content-Type": "application/json" };
}

export async function fetchFromBackend<T>(
  endpoint: string,
  options: RequestInit & { clerkToken?: string } = {}
): Promise<T> {
  const { clerkToken, ...fetchOptions } = options;
  const headers = await getAuthHeaders(clerkToken);

  console.log("[API_SERVER] Fetching:", endpoint, "with headers:", Object.keys(headers));

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...fetchOptions,
    headers: {
      ...headers,
      ...fetchOptions.headers,
    },
    credentials: "include",
    cache: "no-store",
  });

  console.log("[API_SERVER] Response status:", response.status, response.ok);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    console.error("[API_SERVER] Error response:", error);
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const backendApi = {
  get: <T>(endpoint: string, options?: { clerkToken?: string }): Promise<T> =>
    fetchFromBackend<T>(endpoint, { method: "GET", clerkToken: options?.clerkToken }),
  post: <T>(endpoint: string, data: unknown, options?: { clerkToken?: string }): Promise<T> =>
    fetchFromBackend<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      clerkToken: options?.clerkToken,
    }),
  patch: <T>(endpoint: string, data: unknown, options?: { clerkToken?: string }): Promise<T> =>
    fetchFromBackend<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
      clerkToken: options?.clerkToken,
    }),
  delete: <T>(endpoint: string, options?: { clerkToken?: string }): Promise<T> =>
    fetchFromBackend<T>(endpoint, { method: "DELETE", clerkToken: options?.clerkToken }),
};