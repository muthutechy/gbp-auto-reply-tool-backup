import { getToken, getUser, clearSession } from "./auth";
import type { Analytics, AuthResponse, Review } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const user = getUser();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const urlObj = new URL(`${API_URL}${path}`);
  if (user?.tenant_id && !path.startsWith("/auth")) {
    urlObj.searchParams.set("tenant_id", user.tenant_id);
  }
  const url = urlObj.toString();

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError("Unauthorized", 401);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || res.statusText, res.status);
  }
  return data as T;
}

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  me() {
    return request<{ user: AuthResponse["user"] }>("/auth/me");
  },

  getReviews(local = true) {
    return request<{ reviews: Review[]; source: string }>(
      `/reviews${local ? "?local=true" : ""}`
    );
  },

  getReviewsByStatus(status: string) {
    return request<{ reviews: Review[] }>(`/reviews?local=true&status=${status}`);
  },

  getAnalytics() {
    return request<{ analytics: Analytics }>("/analytics");
  },

  approveReview(id: string, reply: string) {
    return request<{ review: Review }>(`/reviews/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ reply }),
    });
  },

  rejectReview(id: string) {
    return request<{ review: Review }>(`/reviews/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  updateReview(id: string, data: Partial<Review>) {
    return request<{ review: Review }>(`/reviews/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
    getGoogleStatus() {
    return request<{ connected: boolean; tenantId: string }>("/google/status");
  },

  connectGoogle() {
    return request<{ url: string }>("/google/auth");
  },

  disconnectGoogle() {
    return request<{ success: boolean }>("/google/disconnect", {
      method: "DELETE",
    });
  },
};

export { ApiError };
