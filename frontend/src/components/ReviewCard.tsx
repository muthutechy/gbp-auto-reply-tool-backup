"use client";

import { useState } from "react";
import type { Review } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "@/lib/format";

interface ReviewCardProps {
  review: Review;
  showActions?: boolean;
  onApprove?: (id: string, reply: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
}

export function ReviewCard({ review, showActions, onApprove, onReject }: ReviewCardProps) {
  const [reply, setReply] = useState(review.ai_reply || "");
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    if (!onApprove) return;
    setLoading(true);
    try {
      await onApprove(review.id, reply);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!onReject) return;
    setLoading(true);
    try {
      await onReject(review.id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-amber-400">
              {"★".repeat(review.rating)}
              <span className="text-zinc-600">{"★".repeat(5 - review.rating)}</span>
            </span>
            <StatusBadge status={review.status} />
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {review.reviewer_name || "Anonymous"} · {formatDate(review.created_at)}
          </p>
        </div>
      </div>

      {review.comment && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Review</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-200">{review.comment}</p>
        </div>
      )}

      {(review.ai_reply || showActions) && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">AI reply</p>
          {showActions ? (
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              className="mt-2 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
            />
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-emerald-100/90">
              {review.ai_reply || review.final_reply || "—"}
            </p>
          )}
        </div>
      )}

      {review.final_reply && review.status === "replied" && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Posted reply</p>
          <p className="mt-1 text-sm text-zinc-300">{review.final_reply}</p>
        </div>
      )}

      {showActions && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || !reply.trim()}
            onClick={handleApprove}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Approve & post
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleReject}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </article>
  );
}
