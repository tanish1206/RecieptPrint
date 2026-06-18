// Vercel Serverless Function: POST /api/analyze
// Handles receipt image upload → Groq Vision AI extraction → Carbon mapping

import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Load emissions database ─────────────────────────────────────────────────
let emissionsDb = { items: [] };
try {
  const emissionsPath = path.join(__dirname, '..', 'backend', 'src', 'data', 'emissions.json');
  const raw = await fs.readFile(emissionsPath, 'utf8');
  emissionsDb = JSON.parse(raw);
} catch (e) {
  console.error('Failed to load emissions.json:', e.message);
}

// ─── Carbon-mapping helpers (inlined from backend/src/utils/carbonMapper.js) ──

const lookupCache = new Map();

function getSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1))
    return (Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)) * 0.9;
  const w1 = s1.split(/\s+/);
  const w2 = s2.split(/\s+/);
  const inter = w1.filter(w => w2.includes(w));
  if (inter.length > 0) return (inter.length * 2) / (w1.length + w2.length) * 0.8;
  return 0.0;
}

function getFallbackItem(rawName) {
  return { name: rawName || 'Unknown', aliases: [], co2_per_kg: 1.5, category: 'misc', unit: 'kg', suggestions: [], isFallback: true };
}

function findEmissionData(rawName) {
  if (!rawName) return getFallbackItem('Unknown');
  const clean = rawName.toLowerCase().trim();
  if (lookupCache.has(clean)) return lookupCache.get(clean);

  let best = null, top = 0;
  for (const item of emissionsDb.items) {
    if (item.name.toLowerCase() === clean) { best = item; top = 1.0; break; }
    const ns = getSimilarity(clean, item.name);
    if (ns > top) { top = ns; best = item; }
    for (const alias of (item.aliases || [])) {
      if (alias.toLowerCase() === clean) { best = item; top = 1.0; break; }
      const as = getSimilarity(clean, alias);
      if (as > top) { top = as; best = item; }
    }
    if (top === 1.0) break;
  }

  const result = (best && top >= 0.3)
    ? { ...best, isFallback: false }
    : getFallbackItem(rawName);
  lookupCache.set(clean, result);
  return result;
}

function calculateEmissions(rawName, quantity, unit) {
  const q = parseFloat(quantity);
  if (isNaN(q) || q <= 0) return { matchedItem: getFallbackItem(rawName), co2e: 0.0 };
  const item = findEmissionData(rawName);
  let mult = 1.0;
  const tu = (unit || '').toLowerCase().trim();
  const bu = item.unit.toLowerCase();
  if (bu === 'kg' && ['g','gm','gram','grams'].includes(tu)) mult = 0.001;
  else if (['litre','liter','l'].includes(bu) && ['ml','milliliter','millilitres'].includes(tu)) mult = 0.001;
  return { matchedItem: item, co2e: Math.round(q * mult * item.co2_per_kg * 100) / 100 };
}

// ─── Groq / xAI Vision call ───────────────────────────────────────────────────

const RECEIPT_PROMPT = `Analyze the attached grocery receipt image and extract all purchased items.
Return ONLY valid JSON — no markdown, no preamble — using this exact schema:
{
  "storeName": "Store Name",
  "receiptDate": "YYYY-MM-DD",
  "totalAmount": 0.00,
  "items": [
    { "name": "Clean Item Name", "quantity": 1.0, "unit": "kg|g|litre|ml|pcs|pack", "price": 0.00 }
  ]
}
Rules:
- Strip HSN codes, POS codes, and discount lines from item names.
- For items like "BASMATI RICE 1KG", extract name="Basmati Rice" and quantity=1, unit="kg".
- For items like "AMUL GOLD MILKY MILK 1 L x2", name="Amul Milk", quantity=2, unit="litre".
- Default quantity to 1, unit to "pcs" if unclear.
- receiptDate: use today's date in YYYY-MM-DD format if not visible on receipt.`;

async function callGroqVision(base64Image, mimeType) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set on the server.');

  const isXai = apiKey.startsWith('xai-');
  const endpoint = isXai
    ? 'https://api.x.ai/v1/chat/completions'
    : 'https://api.groq.com/openai/v1/chat/completions';
  const model = isXai ? 'grok-2-vision-1212' : 'meta-llama/llama-4-scout-17b-16e-instruct';

  const body = {
    model,
    messages: [{ role: 'user', content: [
      { type: 'text', text: RECEIPT_PROMPT },
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
    ]}],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json.error?.message || `API error ${res.status}`;
    if (res.status === 429) throw new Error('429: Rate limit reached. Please wait a moment and try again.');
    throw new Error(msg);
  }

  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error('AI returned an empty response.');

  try {
    const parsed = JSON.parse(raw);
    // Sanitize and normalise
    return {
      storeName: String(parsed.storeName || 'Unknown Store').replace(/<[^>]+>/g, '').trim(),
      receiptDate: String(parsed.receiptDate || new Date().toISOString().split('T')[0]),
      totalAmount: parseFloat(parsed.totalAmount) || 0,
      items: Array.isArray(parsed.items)
        ? parsed.items.map(it => ({
            name:     String(it.name     || 'Unknown').replace(/<[^>]+>/g, '').trim(),
            quantity: parseFloat(it.quantity) || 1,
            unit:     String(it.unit     || 'pcs').trim(),
            price:    parseFloat(it.price)    || 0,
          })).filter(it => it.name && it.name !== 'Unknown')
        : [],
    };
  } catch {
    throw new Error('Failed to parse AI response as JSON. Try uploading a clearer photo.');
  }
}

// ─── Simulated demo data ──────────────────────────────────────────────────────

function getDemoData(warning) {
  return {
    storeName: warning ? 'Reliance Fresh (Simulated)' : 'Reliance Fresh',
    receiptDate: new Date().toISOString().split('T')[0],
    totalAmount: 1450.00,
    items: [
      { name: 'Basmati Rice',  quantity: 2,   unit: 'kg',    price: 180.00 },
      { name: 'Amul Milk',     quantity: 3,   unit: 'litre', price: 195.00 },
      { name: 'Paneer',        quantity: 0.5, unit: 'kg',    price: 150.00 },
      { name: 'Mutton',        quantity: 1,   unit: 'kg',    price: 720.00 },
      { name: 'Tomato',        quantity: 1.5, unit: 'kg',    price: 60.00  },
      { name: 'Onion',         quantity: 2,   unit: 'kg',    price: 80.00  },
    ],
    warning,
  };
}

// ─── Parse multipart form ─────────────────────────────────────────────────────

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: 5 * 1024 * 1024,
      keepExtensions: true,
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    // 1. Parse form
    let files;
    try {
      ({ files } = await parseForm(req));
    } catch (err) {
      if (err.code === 1009 || (err.message && err.message.toLowerCase().includes('maxfilesize'))) {
        return res.status(400).json({ error: 'File size exceeds the 5 MB limit.' });
      }
      return res.status(400).json({ error: 'File upload failed: ' + err.message });
    }

    const uploaded = Array.isArray(files.receipt) ? files.receipt[0] : files.receipt;
    if (!uploaded) return res.status(400).json({ error: 'No file uploaded.' });

    const mime = uploaded.mimetype || uploaded.type || '';
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(mime)) {
      return res.status(400).json({ error: 'Invalid file type. Please upload a JPEG or PNG image.' });
    }

    // 2. Check for mock / guest tokens
    const auth = req.headers.authorization || '';
    const isMock = auth.includes('mock_token_');

    // 3. Extract data
    let extracted;
    if (isMock) {
      extracted = getDemoData(null);
    } else {
      try {
        const buf = await fs.readFile(uploaded.filepath);
        const b64 = buf.toString('base64');
        extracted = await callGroqVision(b64, mime);
      } catch (aiErr) {
        console.error('AI extraction failed, using simulation fallback:', aiErr.message);
        // Only fall back to simulation for non-rate-limit errors
        if (aiErr.message.startsWith('429')) {
          return res.status(429).json({ error: aiErr.message });
        }
        extracted = getDemoData(
          `AI analysis unavailable (${aiErr.message}). Showing simulated results.`
        );
      }
    }

    // 4. Carbon mapping
    let totalEmissions = 0;
    const itemsWithEmissions = extracted.items.map(item => {
      const { matchedItem, co2e } = calculateEmissions(item.name, item.quantity, item.unit);
      totalEmissions += co2e;
      return {
        name:       item.name,
        quantity:   item.quantity,
        unit:       item.unit,
        price:      item.price,
        category:   matchedItem.category,
        co2e,
        isFallback: matchedItem.isFallback,
        suggestions: matchedItem.suggestions || [],
      };
    });

    // 5. Swap suggestions
    const swapSuggestions = [];
    for (const item of itemsWithEmissions) {
      for (const sug of (item.suggestions || [])) {
        swapSuggestions.push({
          originalItem: item.name,
          originalCo2e: item.co2e,
          category:     item.category,
          swapTo:       sug.name,
          swapCo2e:     Math.round(item.quantity * (sug.co2_per_kg || 0) * 100) / 100,
          reason:       sug.reason,
        });
      }
    }

    // 6. Insights
    const insights = [];
    const highest = [...itemsWithEmissions].sort((a,b) => b.co2e - a.co2e)[0];
    if (highest && highest.co2e > 0)
      insights.push(`Your highest carbon item is "${highest.name}" (${highest.co2e} kg CO₂e).`);
    const catTotals = {};
    itemsWithEmissions.forEach(i => { catTotals[i.category] = (catTotals[i.category] || 0) + i.co2e; });
    const topCat = Object.entries(catTotals).sort((a,b) => b[1]-a[1])[0];
    if (topCat) insights.push(`"${topCat[0]}" category contributed the most: ${Math.round(topCat[1]*10)/10} kg CO₂e.`);

    // 7. Impact comparison (Indian petrol car: 0.12 kg CO₂e/km)
    const totalRounded = Math.round(totalEmissions * 100) / 100;
    const impactComparison = {
      drivingEquivalentKm: Math.round((totalRounded / 0.12) * 10) / 10,
      smartphoneCharges:   Math.round(totalRounded / 0.008),
      text: `Your basket footprint of ${totalRounded} kg CO₂e equals driving a petrol car for ${Math.round((totalRounded/0.12)*10)/10} km or charging ${Math.round(totalRounded/0.008)} smartphones.`,
    };

    return res.status(200).json({
      storeName:        extracted.storeName,
      receiptDate:      extracted.receiptDate,
      totalAmount:      extracted.totalAmount,
      items:            itemsWithEmissions,
      totalEmissions:   totalRounded,
      swapSuggestions,
      insights,
      impactComparison,
      warning:          extracted.warning || null,
    });

  } catch (err) {
    console.error('Unhandled error in /api/analyze:', err);
    res.status(500).json({ error: 'An error occurred while analysing the receipt. Please try again.' });
  }
}
