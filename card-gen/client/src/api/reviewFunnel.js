import { authenticatedFetch } from "./auth.js";

// Public endpoints (no auth required, but authenticatedFetch still works fine)
export function submitCardRating(cardId, rating) {
  return authenticatedFetch(`/review-funnel/${cardId}/rating`, {
    method: "POST",
    body: JSON.stringify({ rating }),
  });
}

export function submitNegativeFeedback(cardId, payload) {
  return authenticatedFetch(`/review-funnel/${cardId}/feedback`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function trackGoogleReviewClick(cardId) {
  return authenticatedFetch(`/review-funnel/${cardId}/google-click`, {
    method: "POST",
  });
}

// Protected endpoints (owner/admin)
export function getReviewFunnelStats(cardId) {
  return authenticatedFetch(`/review-funnel/${cardId}/stats`);
}

export function getNegativeFeedbacks(cardId, { limit = 10 } = {}) {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  return authenticatedFetch(`/review-funnel/${cardId}/feedbacks?${qs.toString()}`);
}

