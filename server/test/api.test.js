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
const jwt = require('jsonwebtoken');
const { residents } = require('../src/data/mockData');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

const app = createApp();

function makeTokenForResident(username) {
  const user = residents.find((r) => r.username === username);
  if (!user) {
    throw new Error(`Test user not found: ${username}`);
  }
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const residentToken = makeTokenForResident('nate.craddock');

describe('GET /health', () => {
  it('returns 200 and { status: "ok" }', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, { status: 'ok' });
  });
});

describe('GET /api/gift-cards', () => {
  it('returns 200 and a JSON array of gift cards', async () => {
    const res = await request(app)
      .get('/api/gift-cards')
      .set('Authorization', `Bearer ${residentToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  it('each item has id, brand, and pointCost', async () => {
    const res = await request(app)
      .get('/api/gift-cards')
      .set('Authorization', `Bearer ${residentToken}`);
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
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${residentToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.fullName != null);
    assert.ok(res.body.pointsBalance != null);
    assert.ok(res.body.role != null);
    assert.ok(res.body.unit !== undefined); // may be null for admin
  });

  it('does not include passwordHash', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${residentToken}`);
    assert.strictEqual(res.body.passwordHash, undefined);
  });
});

describe('GET /api/transactions', () => {
  it('returns 200 and object with data, page, limit, total', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${residentToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.strictEqual(typeof res.body.page, 'number');
    assert.strictEqual(typeof res.body.limit, 'number');
    assert.strictEqual(typeof res.body.total, 'number');
  });

  it('defaults to page 1 and limit 10', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${residentToken}`);
    assert.strictEqual(res.body.page, 1);
    assert.strictEqual(res.body.limit, 10);
  });

  it('sorts transactions newest-first by createdAt', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${residentToken}`);
    const data = res.body.data;
    for (let i = 1; i < data.length; i++) {
      const prev = new Date(data[i - 1].createdAt);
      const curr = new Date(data[i].createdAt);
      assert.ok(prev >= curr, 'transactions should be newest first');
    }
  });

  it('honors page and limit query params', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${residentToken}`)
      .query({ page: 1, limit: 2 });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length <= 2);
    assert.strictEqual(res.body.limit, 2);
  });

  it('returns empty data array for out-of-range page with 200', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${residentToken}`)
      .query({ page: 999 });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.length, 0);
  });

  it('returns 400 when page is 0', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${residentToken}`)
      .query({ page: 0 });
    assert.strictEqual(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
    assert.ok(res.body.errors.length >= 1);
  });

  it('returns 400 when limit > 50', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${residentToken}`)
      .query({ limit: 100 });
    assert.strictEqual(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
  });

  it('returns 400 when page is not a number', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${residentToken}`)
      .query({ page: 'abc' });
    assert.strictEqual(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
  });
});

describe('Auth middleware and login', () => {
  it('POST /api/auth/login returns token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nate.craddock', password: 'resident16' });
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body.token === 'string');
  });

  it('POST /api/auth/login returns 400 for empty body', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    assert.strictEqual(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
  });

  it('POST /api/auth/login returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nate.craddock', password: 'wrong' });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.message, 'Invalid credentials');
  });

  it('GET /api/me without token returns 401', async () => {
    const res = await request(app).get('/api/me');
    assert.strictEqual(res.status, 401);
  });

  it('GET /api/gift-cards with invalid token returns 401', async () => {
    const res = await request(app)
      .get('/api/gift-cards')
      .set('Authorization', 'Bearer not.a.real.token');
    assert.strictEqual(res.status, 401);
  });
});

const { giftCards } = require('../src/data/mockData');
const starbucksGiftCardId = giftCards.find((g) => g.brand === 'Starbucks').id;
const visaGiftCardId = giftCards.find((g) => g.brand === 'Visa').id;

describe('POST /api/redemptions', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app)
      .post('/api/redemptions')
      .send({ giftCardId: starbucksGiftCardId });
    assert.strictEqual(res.status, 401);
  });

  it('returns 400 for empty body', async () => {
    const res = await request(app)
      .post('/api/redemptions')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({});
    assert.strictEqual(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
    assert.ok(res.body.errors.length >= 1);
  });

  it('returns 400 for invalid giftCardId (non-UUID)', async () => {
    const res = await request(app)
      .post('/api/redemptions')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ giftCardId: 'not-a-uuid' });
    assert.strictEqual(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
  });

  it('returns 404 when gift card does not exist', async () => {
    const res = await request(app)
      .post('/api/redemptions')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ giftCardId: '00000000-0000-0000-0000-000000000000' });
    assert.strictEqual(res.status, 404);
    assert.ok(res.body.message);
  });

  it('returns 422 when insufficient balance', async () => {
    const jeremyToken = makeTokenForResident('jeremy.aguillon');
    const res = await request(app)
      .post('/api/redemptions')
      .set('Authorization', `Bearer ${jeremyToken}`)
      .send({ giftCardId: visaGiftCardId });
    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.body.message, 'Insufficient points');
    assert.strictEqual(typeof res.body.pointsBalance, 'number');
    assert.strictEqual(res.body.required, 1000);
  });

  it('returns 200 and updated pointsBalance when balance is sufficient', async () => {
    const meBefore = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${residentToken}`);
    assert.strictEqual(meBefore.status, 200);
    const balanceBefore = meBefore.body.pointsBalance;

    const res = await request(app)
      .post('/api/redemptions')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ giftCardId: starbucksGiftCardId });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof res.body.pointsBalance, 'number');
    assert.strictEqual(res.body.pointsBalance, balanceBefore - 200);
  });

  it('adds a redemption transaction for the resident', async () => {
    const txBefore = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${residentToken}`)
      .query({ page: 1, limit: 1 });
    assert.strictEqual(txBefore.status, 200);
    const idsBefore = new Set(txBefore.body.data.map((t) => t.id));

    const res = await request(app)
      .post('/api/redemptions')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ giftCardId: starbucksGiftCardId });
    assert.strictEqual(res.status, 200);

    const txAfter = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${residentToken}`)
      .query({ page: 1, limit: 5 });
    assert.strictEqual(txAfter.status, 200);
    const newest = txAfter.body.data[0];
    assert.ok(newest);
    assert.strictEqual(newest.type, 'redemption');
    assert.ok(newest.description.includes('Starbucks'));
    assert.ok(newest.description.includes('Gift Card'));
    assert.strictEqual(newest.points, -200);
    assert.ok(!idsBefore.has(newest.id), 'new transaction id');
  });
});
