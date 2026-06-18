/**
 * @file analyze.test.js
 * @description Integration tests for POST /api/analyze route.
 * Uses supertest to exercise HTTP-level validation and response shapes.
 */

import request  from 'supertest';
import path     from 'path';
import { fileURLToPath } from 'url';
import app      from '../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// A tiny valid 1×1 JPEG in base64 — avoids need for a fixture file
const TINY_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH' +
  'BwYIDAoMCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAALCAAB' +
  'AAEBAREAAP/EABoAAQEBAQEBAQAAAAAAAAAAAAAHBgUEA//EABcQAQEBAQAAAAAA' +
  'AAAAAAAAAAARITH/2gAIAQEAAD8AqFQAAAAAAAAAAAAAAAAA//Z';

const TINY_JPEG_BUF = Buffer.from(TINY_JPEG_BASE64.replace(/\n/g, ''), 'base64');

const MOCK_TOKEN = 'Bearer mock_token_test';

describe('POST /api/analyze', () => {

  // ── Auth ──────────────────────────────────────────────────────────────────

  test('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .attach('receipt', TINY_JPEG_BUF, { filename: 'receipt.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  // ── File validation ───────────────────────────────────────────────────────

  test('returns 400 when no file is attached', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', MOCK_TOKEN)
      .send();
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no file/i);
  });

  test('returns 400 for disallowed MIME type (text/plain)', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', MOCK_TOKEN)
      .attach('receipt', Buffer.from('not an image'), {
        filename: 'receipt.txt',
        contentType: 'text/plain',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid file type/i);
  });

  test('returns 400 for disallowed MIME type (application/json)', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', MOCK_TOKEN)
      .attach('receipt', Buffer.from('{}'), {
        filename: 'data.json',
        contentType: 'application/json',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid file type/i);
  });

  test('returns 400 for file exceeding 5 MB', async () => {
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB
    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', MOCK_TOKEN)
      .attach('receipt', bigBuffer, {
        filename: 'big.jpg',
        contentType: 'image/jpeg',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/5\s*mb|size/i);
  });

  // ── Response shape (mock token path — no real Groq call) ─────────────────

  test('returns 200 with structured JSON for mock token + valid image', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', MOCK_TOKEN)
      .attach('receipt', TINY_JPEG_BUF, { filename: 'receipt.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('storeName');
    expect(res.body).toHaveProperty('totalEmissions');
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('every item in response has required fields', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', MOCK_TOKEN)
      .attach('receipt', TINY_JPEG_BUF, { filename: 'receipt.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    res.body.items.forEach(item => {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('co2e');
      expect(item).toHaveProperty('category');
      expect(typeof item.co2e).toBe('number');
    });
  });

  test('totalEmissions equals the sum of all item CO₂e values', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', MOCK_TOKEN)
      .attach('receipt', TINY_JPEG_BUF, { filename: 'receipt.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    const itemSum = res.body.items.reduce((acc, i) => acc + i.co2e, 0);
    expect(Math.abs(res.body.totalEmissions - itemSum)).toBeLessThan(0.01);
  });

  test('swapSuggestions is an array (may be empty)', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', MOCK_TOKEN)
      .attach('receipt', TINY_JPEG_BUF, { filename: 'receipt.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.swapSuggestions)).toBe(true);
  });

  test('impactComparison contains driving equivalent', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .set('Authorization', MOCK_TOKEN)
      .attach('receipt', TINY_JPEG_BUF, { filename: 'receipt.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('impactComparison');
    expect(res.body.impactComparison).toHaveProperty('drivingEquivalentKm');
  });
});

// ── Health check ──────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  test('returns 200 with status OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body).toHaveProperty('timestamp');
  });
});
