const { openai } = require("../lib/openai");
const { createError } = require("../utils/errors");
const { getRandomOpening } = require("./replyVariation.service");

const MAX_LINES = 3;
const MAX_CHARS = 300;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function buildPrompt({ reviewText, businessName, keyword, location, tone, policyFeedback, opening }) {
  const locationLine = location
    ? `- Optionally mention the location once: "${location}"`
    : "- Do not invent a location.";

  const openingLine = opening || getRandomOpening();

  return `You write Google Business Profile review replies for a local business.

Start the reply with: "${openingLine}"

Business name: ${businessName}
Primary keyword: ${keyword}
Tone: ${tone}
${locationLine}

Customer review:
"""
${reviewText || "(No review text — respond graciously to the rating.)"}
"""

Write ONE reply that:
1. Is at most 3 short lines (use line breaks sparingly; prefer 1–2 sentences).
2. Sounds human, warm, and ${tone} — never promotional or salesy.
3. Uses the primary keyword OR a natural synonym exactly once (not more).
4. Mentions the business name exactly once.
5. Never repeats the same word or phrase (avoid "thank you" twice, etc.).
6. Does not include URLs, phone numbers, emails, hashtags, or emojis.
7. Stays under ${MAX_CHARS} characters total.
8. Thanks the reviewer and addresses their specific points when possible.

Return ONLY the reply text, nothing else.${
    policyFeedback
      ? `

IMPORTANT — your previous draft failed policy checks. Fix these issues: ${policyFeedback}
Do NOT use promotional phrases like "best service", "number 1", "top service", or "cheap and best".`
      : ""
  }`;
}

function normalizeReply(text) {
  let reply = text.trim().replace(/^["']|["']$/g, "");

  const lines = reply
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > MAX_LINES) {
    reply = lines.slice(0, MAX_LINES).join("\n");
  } else {
    reply = lines.join("\n");
  }

  if (reply.length > MAX_CHARS) {
    reply = reply.slice(0, MAX_CHARS).trim();
    const lastSpace = reply.lastIndexOf(" ");
    if (lastSpace > MAX_CHARS * 0.7) {
      reply = reply.slice(0, lastSpace).trim();
    }
  }

  return reply;
}

function validateInput({ reviewText, businessName, keyword, tone }) {
  if (!businessName?.trim()) {
    throw createError("businessName is required", 400);
  }
  if (!keyword?.trim()) {
    throw createError("keyword is required", 400);
  }
  if (!tone?.trim()) {
    throw createError("tone is required", 400);
  }
  if (reviewText !== undefined && reviewText !== null && typeof reviewText !== "string") {
    throw createError("reviewText must be a string", 400);
  }
}

/**
 * Generate an SEO-optimized review reply.
 *
 * @param {Object} params
 * @param {string} [params.reviewText]
 * @param {string} params.businessName
 * @param {string} params.keyword
 * @param {string} [params.location]
 * @param {string} params.tone - e.g. friendly, professional, formal
 * @returns {Promise<{ reply: string }>}
 */
async function generateReviewReply({
  reviewText = "",
  businessName,
  keyword,
  location = "",
  tone = "friendly",
  policyFeedback,
}) {
  validateInput({ reviewText, businessName, keyword, tone });

  const prompt = buildPrompt({
    reviewText: reviewText.trim(),
    businessName: businessName.trim(),
    keyword: keyword.trim(),
    location: location?.trim() || "",
    tone: tone.trim().toLowerCase(),
    policyFeedback,
  });

  const completion = await openai().chat.completions.create({
    model: MODEL,
    temperature: 0.8,
    max_tokens: 150,
    messages: [
      {
        role: "system",
        content:
          "You are an expert at writing concise, authentic Google review replies for local businesses. Follow every constraint exactly.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw createError("AI returned an empty reply", 502);
  }

  const reply = normalizeReply(raw);
  if (!reply) {
    throw createError("AI returned an invalid reply", 502);
  }

  return { reply };
}

module.exports = { generateReviewReply, buildPrompt, normalizeReply, MAX_CHARS };
