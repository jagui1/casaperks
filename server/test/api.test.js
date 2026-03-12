/**
 * API contract tests. Keep these passing when adding Phase 3 (auth) and Phase 4 (redemption).
 *
 * What they protect:
 * - Phase 3: After adding JWT auth, protected routes must still return the same response
 *   shape when a valid token is sent; add new tests for 401 when no/invalid token.
 * - Phase 4: Dashboard, transactions page, and redemption flow call these same endpoints;
 *   these tests ensure response shapes (e.g. data, page, limit, total; gift card id/brand/pointCost)
 *   stay stable so the frontend does not break.
 */
const { createApp } = require('../src/app');
const assert = require('node:assert');
const { describe, it } = require('node:test');
const request = require('supertest');

const app = createApp();

describe('GET /health', () => {
  it('returns 200 and { status: "ok" }', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, { status: 'ok' });
  });
});

describe('GET /api/gift-cards', () => {
  it('returns 200 and a JSON array of gift cards', async () => {
    const res = await request(app).get('/api/gift-cards');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  it('each item has id, brand, and pointCost', async () => {
    const res = await request(app).get('/api/gift-cards');
    assert.ok(res.body.length >= 5, 'catalog should have at least 5 items');
    for (const card of res.body) {
      assert.ok(card.id != null, 'gift card has id');
      assert.ok(typeof card.brand === 'string', 'gift card has brand');
      assert.ok(typeof card.pointCost === 'number', 'gift card has pointCost');
    }
  });
});

describe('GET /api/me', () => {
  it('returns 200 and profile with fullName, unit, pointsBalance, role', async () => {
    const res = await request(app).get('/api/me');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.fullName != null);
    assert.ok(res.body.pointsBalance != null);
    assert.ok(res.body.role != null);
    assert.ok(res.body.unit !== undefined); // may be null for admin
  });

  it('does not include passwordHash', async () => {
    const res = await request(app).get('/api/me');
    assert.strictEqual(res.body.passwordHash, undefined);
  });
});

describe('GET /api/transactions', () => {
  it('returns 200 and object with data, page, limit, total', async () => {
    const res = await request(app).get('/api/transactions');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.strictEqual(typeof res.body.page, 'number');
    assert.strictEqual(typeof res.body.limit, 'number');
    assert.strictEqual(typeof res.body.total, 'number');
  });

  it('defaults to page 1 and limit 10', async () => {
    const res = await request(app).get('/api/transactions');
    assert.strictEqual(res.body.page, 1);
    assert.strictEqual(res.body.limit, 10);
  });

  it('sorts transactions newest-first by createdAt', async () => {
    const res = await request(app).get('/api/transactions');
    const data = res.body.data;
    for (let i = 1; i < data.length; i++) {
      const prev = new Date(data[i - 1].createdAt);
      const curr = new Date(data[i].createdAt);
      assert.ok(prev >= curr, 'transactions should be newest first');
    }
  });

  it('honors page and limit query params', async () => {
    const res = await request(app).get('/api/transactions').query({ page: 1, limit: 2 });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length <= 2);
    assert.strictEqual(res.body.limit, 2);
  });

  it('returns empty data array for out-of-range page with 200', async () => {
    const res = await request(app).get('/api/transactions').query({ page: 999 });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.length, 0);
  });

  it('returns 400 when page is 0', async () => {
    const res = await request(app).get('/api/transactions').query({ page: 0 });
    assert.strictEqual(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
    assert.ok(res.body.errors.length >= 1);
  });

  it('returns 400 when limit > 50', async () => {
    const res = await request(app).get('/api/transactions').query({ limit: 100 });
    assert.strictEqual(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
  });

  it('returns 400 when page is not a number', async () => {
    const res = await request(app).get('/api/transactions').query({ page: 'abc' });
    assert.strictEqual(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
  });
});
