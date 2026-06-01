const aiService = require("./ai.service");
const { checkPolicy } = require("./policyEngine.service");
const { isTooSimilar, getLastReplies } = require("./similarity.service");

const MAX_GENERATION_ATTEMPTS = parseInt(process.env.REPLY_GENERATION_MAX_ATTEMPTS || "3", 10);

/**
 * Generate a reply that passes policy + similarity checks (with retries).
 */
async function generateProductionReply(review, tenant) {
  const oldReplies = await getLastReplies(tenant.id);
  let lastReply = "";
  let lastPolicy = { isValid: false, issues: [] };
  let feedbackParts = [];

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const policyFeedback = feedbackParts.join("; ") || undefined;

    const { reply } = await aiService.generateReviewReply({
      reviewText: review.comment || "",
      businessName: tenant.business_name,
      keyword: tenant.primary_keyword,
      location: tenant.location || "",
      tone: tenant.tone || "friendly",
      policyFeedback,
    });

    lastReply = reply;
    lastPolicy = checkPolicy(reply);

    if (!lastPolicy.isValid) {
      feedbackParts = [
        `Policy fixes required: ${lastPolicy.issues.join(", ")}`,
      ];
      continue;
    }

    if (isTooSimilar(reply, oldReplies)) {
      feedbackParts = [
        "Write a distinctly different reply. Do not reuse the same opening, structure, or phrases as recent replies.",
      ];
      lastPolicy = { isValid: false, issues: ["Too similar to a previous reply"] };
      continue;
    }

    return { reply, policy: lastPolicy, attempts: attempt + 1 };
  }

  return {
    reply: lastReply,
    policy: lastPolicy,
    attempts: MAX_GENERATION_ATTEMPTS,
    failed: true,
  };
}

module.exports = { generateProductionReply, MAX_GENERATION_ATTEMPTS };
