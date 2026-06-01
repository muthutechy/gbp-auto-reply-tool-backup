const { supabase } = require("../lib/supabase");
const { createError, fromSupabaseError } = require("../utils/errors");

const REVIEW_STATUSES = ["pending", "awaiting_approval", "approved", "replied", "rejected"];

function assertTenantAccess(tenantId, actor) {
  if (actor.role === "admin") return;
  if (actor.tenantId !== tenantId) {
    throw createError("Access denied to this tenant", 403);
  }
}

async function listReviews({ tenantId, status }) {
  if (!tenantId) {
    throw createError("tenant_id is required", 400);
  }

  let query = supabase()
    .from("reviews")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw fromSupabaseError(error);
  return data;
}

async function getReviewById(id) {
  const { data, error } = await supabase().from("reviews").select("*").eq("id", id).single();

  if (error || !data) throw createError("Review not found", 404);
  return data;
}

async function createReview(payload, actor) {
  const tenant_id = payload.tenant_id || actor.tenantId;

  if (!tenant_id) {
    throw createError("tenant_id is required", 400);
  }

  assertTenantAccess(tenant_id, actor);

  if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
    throw createError("rating must be between 1 and 5", 400);
  }

  if (payload.status && !REVIEW_STATUSES.includes(payload.status)) {
    throw createError("Invalid status", 400);
  }

  const { data, error } = await supabase()
    .from("reviews")
    .insert({
      tenant_id,
      external_id: payload.external_id ?? null,
      rating: payload.rating,
      comment: payload.comment ?? null,
      reviewer_name: payload.reviewer_name ?? null,
      status: payload.status ?? "pending",
      ai_reply: payload.ai_reply ?? null,
      final_reply: payload.final_reply ?? null,
    })
    .select()
    .single();

  if (error) throw fromSupabaseError(error);
  return data;
}

async function updateReview(id, payload, actor) {
  const existing = await getReviewById(id);
  assertTenantAccess(existing.tenant_id, actor);

  const allowed = ["rating", "comment", "reviewer_name", "status", "ai_reply", "final_reply", "external_id"];
  const updates = {};

  for (const key of allowed) {
    if (payload[key] !== undefined) updates[key] = payload[key];
  }

  if (updates.status && !REVIEW_STATUSES.includes(updates.status)) {
    throw createError("Invalid status", 400);
  }

  if (updates.rating && (updates.rating < 1 || updates.rating > 5)) {
    throw createError("rating must be between 1 and 5", 400);
  }

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  const { data, error } = await supabase()
    .from("reviews")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw fromSupabaseError(error);
  return data;
}

async function deleteReview(id, actor) {
  const existing = await getReviewById(id);
  assertTenantAccess(existing.tenant_id, actor);

  const { error } = await supabase().from("reviews").delete().eq("id", id);
  if (error) throw fromSupabaseError(error);
  return { success: true };
}

module.exports = { listReviews, getReviewById, createReview, updateReview, deleteReview };
