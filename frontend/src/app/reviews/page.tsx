"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ReviewCard } from "@/components/ReviewCard";
import { api } from "@/lib/api";
import type { Review } from "@/types";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res =
        filter === "all"
          ? await api.getReviews(true)
          : await api.getReviewsByStatus(filter);
      setReviews(res.reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  return (
    <AuthGuard>
      <DashboardLayout>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50">Reviews</h1>
            <p className="mt-1 text-sm text-zinc-500">All reviews with AI-generated replies</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="awaiting_approval">Awaiting approval</option>
            <option value="replied">Replied</option>
            <option value="rejected">Rejected</option>
          </select>
        </header>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        )}

        {loading ? (
          <p className="mt-8 text-zinc-500">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="mt-8 text-zinc-500">No reviews found.</p>
        ) : (
          <div className="mt-8 space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
