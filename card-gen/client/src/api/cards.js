import { authenticatedFetch } from './auth.js';

// Card API functions
export async function getAllCards(params) {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.isPublic !== undefined) query.append('isPublic', params.isPublic.toString());
  
  return authenticatedFetch(`/cards?${query.toString()}`);
}

export async function getCardById(id) {
  return authenticatedFetch(`/cards/${id}`);
}

export async function getCardBySubmissionId(submissionId) {
  try {
    const result = await authenticatedFetch(`/cards/submission/${submissionId}`);
    console.log(`✅ API: Found customized card for submission ${submissionId}:`, result._id);
    return result;
  } catch (error) {
    if (error.message.includes('404')) {
      return null; // No customized card found (this is normal)
    }
    console.error('Error fetching card by submission ID:', error);
    return null;
  }
}

export async function getCardByClientId(clientId) {
  try {
    const result = await authenticatedFetch(`/cards/client/${clientId}`);
    console.log(`✅ API: Found generated card for client ${clientId}:`, result._id);
    return result;
  } catch (error) {
    if (error.message.includes('404')) {
      return null; // No generated card found (this is normal)
    }
    console.error('Error fetching card by client ID:', error);
    return null;
  }
}

// Submission API functions
export async function getAllSubmissions() {
  const res = await fetch(`${API_BASE}/submissions`);
  if (!res.ok) throw new Error(`Get submissions failed: ${res.status}`);
  return res.json();
}

// Debug function to see all cards
export async function getAllCardsDebug() {
  // Use authenticatedFetch to honor proxy/base URL and auth if present
  return authenticatedFetch('/cards');
}

export async function createCard(payload) {
  console.log('createCard - Payload:', payload);
  return authenticatedFetch('/cards', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateCard(id, payload) {
  return authenticatedFetch(`/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteCard(id) {
  return authenticatedFetch(`/cards/${id}`, {
    method: 'DELETE'
  });
}

export async function toggleCardPublic(id) {
  return authenticatedFetch(`/cards/${id}/toggle-public`, {
    method: 'PATCH',
    body: JSON.stringify({})
  });
}

export async function getCardAnalytics(id) {
  return authenticatedFetch(`/cards/${id}/analytics`);
}

// Legacy submission API (for backward compatibility)
export async function createSubmission(payload) {
  return createCard(payload);
}

export async function updateSubmission(id, payload) {
  return updateCard(id, payload);
}

export async function getSubmissionById(id) {
  const result = await getCardById(id);
  return result.card;
}

// Update payment status
export async function updatePaymentStatus(cardId, paymentStatus) {
  return authenticatedFetch(`/cards/${cardId}/payment-status`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentStatus })
  });
}


