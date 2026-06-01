"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { api } from "@/lib/api";
import { formatResponseTime } from "@/lib/format";
import type { Analytics } from "@/types";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getAnalytics()
      .then((res) => setAnalytics(res.analytics))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <AuthGuard>
      <DashboardLayout>
        <header>
          <h1 className="text-2xl font-semibold text-zinc-50">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Overview of your review performance</p>
        </header>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total reviews" value={analytics?.totalReviews ?? "—"} />
          <StatCard
            label="Replied"
            value={analytics ? `${analytics.repliedPercent}%` : "—"}
            hint={analytics ? `${analytics.repliedCount} posted` : undefined}
          />
          <StatCard
            label="Pending approvals"
            value={analytics?.pendingApprovals ?? "—"}
            hint="Needs your action"
          />
          <StatCard
            label="Avg response time"
            value={
              analytics
                ? formatResponseTime(
                    analytics.avgResponseTimeMinutes,
                    analytics.avgResponseTimeHours
                  )
                : "—"
            }
            hint="Review → reply"
          />
        </div>

        {analytics && analytics.pendingApprovals > 0 && (
          <div className="mt-8 rounded-xl border border-orange-500/30 bg-orange-500/10 p-5">
            <p className="font-medium text-orange-200">
              {analytics.pendingApprovals} review
              {analytics.pendingApprovals !== 1 ? "s" : ""} awaiting approval
            </p>
            <Link
              href="/approvals"
              className="mt-2 inline-block text-sm font-medium text-orange-300 hover:underline"
            >
              Go to approvals →
            </Link>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
