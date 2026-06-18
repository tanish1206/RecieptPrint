/**
 * api.js — ReceiptPrint frontend API helper
 * All calls to the Express backend go through here.
 */

// In production (Vercel): VITE_API_URL is not set → defaults to '' (relative paths → /api/...)
// In local dev:           VITE_API_URL=http://localhost:5000
const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * Uploads a receipt image file to the backend for AI analysis.
 * @param {File} file - The receipt file (JPEG/PNG/PDF)
 * @param {string} accessToken - Supabase JWT access token
 * @returns {Promise<object>} Analysis result from backend
 */
export async function analyzeReceipt(file, accessToken) {
  const formData = new FormData();
  formData.append('receipt', file);

  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Failed to parse receipt data from AI response.');
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('429 — Rate limit reached. Please wait a moment and try again.');
    }
    throw new Error(data.error || `Server error: ${response.status}`);
  }

  return data;
}

/**
 * Saves a processed receipt to the user's history in Supabase (via backend).
 * @param {object} result - The analysis result returned by analyzeReceipt
 * @param {string} accessToken - Supabase JWT access token
 * @returns {Promise<object>}
 */
export async function saveToHistory(result, accessToken) {
  const response = await fetch(`${API_BASE}/api/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      storeName: result.storeName,
      receiptDate: result.receiptDate,
      totalAmount: result.totalAmount,
      totalEmissions: result.totalEmissions,
      items: result.items,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Non-fatal — history save failure shouldn't block the user from seeing results
    console.warn('Failed to save receipt to history:', data.error);
  }

  return data;
}

/**
 * Fetches the receipt history for the logged-in user.
 * @param {string} accessToken - Supabase JWT access token
 * @returns {Promise<Array>}
 */
export async function fetchHistory(accessToken) {
  const response = await fetch(`${API_BASE}/api/history`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load history');
  }

  return data;
}
