// Vercel Serverless Function: GET/POST/DELETE /api/history
// Handles receipt history via Supabase. Falls back to a 200 OK empty array
// when Supabase is not configured (so the frontend never hard-crashes).

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Simple JWT parser to extract user_id from Supabase JWT (no verification needed —
// Supabase's own getUser() call verifies it).
async function getUserFromToken(token) {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  const isMock = token.startsWith('mock_token_');

  // ── Mock / guest mode: use localStorage on frontend side, return empty list ──
  if (isMock) {
    if (req.method === 'GET')    return res.status(200).json([]);
    if (req.method === 'POST')   return res.status(201).json({ message: 'Saved (demo mode).', receiptId: 'mock-' + Date.now() });
    if (req.method === 'DELETE') return res.status(200).json({ message: 'Deleted (demo mode).' });
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Supabase not configured — return gracefully
    if (req.method === 'GET')  return res.status(200).json([]);
    return res.status(200).json({ message: 'History not available (Supabase not configured).' });
  }

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid or expired session.' });

  // ── GET /api/history ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('receipts')
      .select('*, items:receipt_items(*)')
      .eq('user_id', user.id)
      .order('receipt_date', { ascending: false });

    if (error) {
      console.error('History fetch error:', error);
      return res.status(500).json({ error: 'Failed to load history.' });
    }
    return res.status(200).json(data);
  }

  // ── POST /api/history ─────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body.' });
    }

    const { storeName, receiptDate, totalAmount, totalEmissions, items = [] } = body;

    const { data: receiptData, error: receiptError } = await supabase
      .from('receipts')
      .insert({ user_id: user.id, store_name: storeName, receipt_date: receiptDate,
                total_amount: parseFloat(totalAmount) || 0, total_emissions: parseFloat(totalEmissions) || 0 })
      .select().single();

    if (receiptError || !receiptData) {
      console.error('Insert receipt error:', receiptError);
      return res.status(500).json({ error: 'Failed to save receipt.' });
    }

    if (items.length > 0) {
      const rows = items.map(i => ({
        receipt_id:  receiptData.id,
        name:        i.name || 'Unknown',
        quantity:    parseFloat(i.quantity) || 1,
        unit:        i.unit || 'pcs',
        price:       parseFloat(i.price) || 0,
        category:    i.category || 'misc',
        co2e:        parseFloat(i.co2e) || 0,
        is_fallback: !!i.isFallback,
      }));

      const { error: itemsError } = await supabase.from('receipt_items').insert(rows);
      if (itemsError) {
        await supabase.from('receipts').delete().eq('id', receiptData.id);
        return res.status(500).json({ error: 'Failed to save receipt items.' });
      }
    }

    return res.status(201).json({ message: 'Saved.', receiptId: receiptData.id });
  }

  // ── DELETE /api/history/:id ───────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const id = req.url.split('/').pop();
    if (!id || id === 'history') return res.status(400).json({ error: 'Receipt ID required.' });

    const { error } = await supabase.from('receipts')
      .delete().eq('id', id).eq('user_id', user.id);

    if (error) return res.status(500).json({ error: 'Failed to delete receipt.' });
    return res.status(200).json({ message: 'Deleted.' });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
