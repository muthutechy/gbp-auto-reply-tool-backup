"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ReviewCard } from "@/components/ReviewCard";
import { api } from "@/lib/api";
import type { Review } from "@/types";

export default function ApprovalsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.getReviewsByStatus("awaiting_approval");
      setReviews(res.reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id: string, reply: string) {
    await api.approveReview(id, reply);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleReject(id: string) {
    await api.rejectReview(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <header>
          <h1 className="text-2xl font-semibold text-zinc-50">Approvals</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Edit AI replies, then approve to post or reject
          </p>
        </header>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        )}

        {loading ? (
          <p className="mt-8 text-zinc-500">Loading…</p>
        ) : reviews.length === 0 ? (
          <p className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-10 text-center text-zinc-500">
            No reviews pending approval.
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showActions
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
