const { supabase } = require("../lib/supabase");
const { createError, fromSupabaseError } = require("../utils/errors");

async function getAnalytics(tenantId) {
  if (!tenantId) {
    throw createError("tenant_id is required", 400);
  }

  const { data: reviews, error } = await supabase()
    .from("reviews")
    .select("id, status, created_at, updated_at, replied_at")
    .eq("tenant_id", tenantId);

  if (error) throw fromSupabaseError(error);

  const rows = reviews || [];
  const totalReviews = rows.length;
  const repliedCount = rows.filter((r) => r.status === "replied").length;
  const pendingApprovals = rows.filter((r) => r.status === "awaiting_approval").length;
  const pendingProcessing = rows.filter((r) => r.status === "pending").length;

  const repliedRows = rows.filter((r) => r.status === "replied");
  let avgResponseTimeMs = 0;

  if (repliedRows.length > 0) {
    const totalMs = repliedRows.reduce((sum, review) => {
      const start = new Date(review.created_at).getTime();
      const end = new Date(review.replied_at || review.updated_at).getTime();
      return sum + Math.max(0, end - start);
    }, 0);
    avgResponseTimeMs = totalMs / repliedRows.length;
  }

  const repliedPercent = totalReviews > 0 ? Math.round((repliedCount / totalReviews) * 1000) / 10 : 0;
  const avgResponseTimeMinutes = Math.round(avgResponseTimeMs / 60000);

  return {
    totalReviews,
    repliedCount,
    repliedPercent,
    pendingApprovals,
    pendingProcessing,
    avgResponseTimeMs: Math.round(avgResponseTimeMs),
    avgResponseTimeMinutes,
    avgResponseTimeHours: Math.round((avgResponseTimeMs / 3600000) * 10) / 10,
  };
}

module.exports = { getAnalytics };
