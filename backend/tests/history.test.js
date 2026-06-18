/**
 * @file history.test.js
 * @description Integration tests for GET/POST/DELETE /api/history route.
 */

import request from 'supertest';
import app     from '../server.js';

const MOCK_TOKEN  = 'Bearer mock_token_test_history';
const NO_TOKEN    = '';

describe('GET /api/history', () => {
  test('returns 401 with no Authorization header', async () => {
    const res = await request(app).get('/api/history');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 401 with malformed Authorization header (no Bearer)', async () => {
    const res = await request(app)
      .get('/api/history')
      .set('Authorization', 'invalid_header');
    expect(res.status).toBe(401);
  });

  test('returns 200 and an array for mock token (guest/demo mode)', async () => {
    const res = await request(app)
      .get('/api/history')
      .set('Authorization', MOCK_TOKEN);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/history', () => {
  test('returns 401 with no auth token', async () => {
    const res = await request(app)
      .post('/api/history')
      .send({ storeName: 'Test Store' });
    expect(res.status).toBe(401);
  });

  test('returns 2xx with mock token and valid receipt payload', async () => {
    const payload = {
      storeName:       'Big Bazaar',
      receiptDate:     '2024-05-28',
      totalAmount:     1295.00,
      totalEmissions:  4.8,
      items: [
        { name: 'rice', quantity: 1, unit: 'kg', price: 105, category: 'grains', co2e: 2.5, isFallback: false },
      ],
    };

    const res = await request(app)
      .post('/api/history')
      .set('Authorization', MOCK_TOKEN)
      .send(payload);

    // In mock mode, save returns 201 or 200
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('message');
  });

  test('returns 2xx for mock token with empty items array', async () => {
    const res = await request(app)
      .post('/api/history')
      .set('Authorization', MOCK_TOKEN)
      .send({ storeName: 'Empty Store', totalEmissions: 0, items: [] });
    expect([200, 201]).toContain(res.status);
  });
});

describe('DELETE /api/history/:id', () => {
  test('returns 401 with no auth token', async () => {
    const res = await request(app).delete('/api/history/some-receipt-id');
    expect(res.status).toBe(401);
  });

  test('returns 2xx for mock token (demo delete)', async () => {
    const res = await request(app)
      .delete('/api/history/mock-receipt-123')
      .set('Authorization', MOCK_TOKEN);
    // In mock mode there's nothing to delete, returns 200/404
    expect([200, 404]).toContain(res.status);
  });
});
