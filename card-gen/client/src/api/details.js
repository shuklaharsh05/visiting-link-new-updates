import { authenticatedFetch } from "./auth.js";

export async function getDetailsForCard(cardId) {
  const res = await authenticatedFetch(`/details/for-card/${cardId}`);
  return res;
}

export async function ensureDetailsToken(cardId) {
  const res = await authenticatedFetch(`/details/ensure-token/${cardId}`, {
    method: "POST",
  });
  return res;
}

export async function markDetailsApplied(detailsId) {
  const res = await authenticatedFetch(`/details/${detailsId}/applied`, {
    method: "PATCH",
  });
  return res;
}
