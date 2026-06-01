export type UserRole = "admin" | "client";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  tenant_id: string | null;
}

export interface Review {
  id: string;
  tenant_id: string;
  external_id: string | null;
  rating: number;
  comment: string | null;
  reviewer_name: string | null;
  status: string;
  ai_reply: string | null;
  final_reply: string | null;
  created_at: string;
  updated_at: string;
  replied_at?: string | null;
}

export interface Analytics {
  totalReviews: number;
  repliedCount: number;
  repliedPercent: number;
  pendingApprovals: number;
  pendingProcessing: number;
  avgResponseTimeMs: number;
  avgResponseTimeMinutes: number;
  avgResponseTimeHours: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}
