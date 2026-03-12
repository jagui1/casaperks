/**
 * Mock data shape tests. Phase 3/4 depend on residents, transactions, and giftCards
 * having the right fields; these tests catch accidental changes.
 */
const assert = require('node:assert');
const { describe, it } = require('node:test');
const { residents, transactions, giftCards } = require('../src/data/mockData');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('mockData.residents', () => {
  it('exports at least 3 residents', () => {
    assert.ok(residents.length >= 3);
  });

  it('each resident has id, username, passwordHash, role, fullName, unit, pointsBalance', () => {
    for (const r of residents) {
      assert.ok(r.id != null && UUID_REGEX.test(r.id), 'id is UUID');
      assert.strictEqual(typeof r.username, 'string');
      assert.strictEqual(typeof r.passwordHash, 'string');
      assert.ok(['resident', 'admin'].includes(r.role));
      assert.strictEqual(typeof r.fullName, 'string');
      assert.ok(r.pointsBalance != null && typeof r.pointsBalance === 'number');
    }
  });

  it('no plaintext passwords in file (passwordHash looks like bcrypt)', () => {
    for (const r of residents) {
      assert.ok(r.passwordHash.startsWith('$2'), 'passwordHash should look like bcrypt');
      assert.ok(r.passwordHash.length > 20);
    }
  });
});

describe('mockData.transactions', () => {
  it('each transaction has id, residentId, type, description, points, createdAt', () => {
    for (const t of transactions) {
      assert.ok(UUID_REGEX.test(t.id));
      assert.ok(UUID_REGEX.test(t.residentId));
      assert.ok(['credit', 'redemption'].includes(t.type));
      assert.strictEqual(typeof t.description, 'string');
      assert.strictEqual(typeof t.points, 'number');
      assert.ok(t.createdAt != null);
    }
  });
});

describe('mockData.giftCards', () => {
  it('exports at least 5 gift cards', () => {
    assert.ok(giftCards.length >= 5);
  });

  it('each gift card has id, brand, pointCost', () => {
    for (const g of giftCards) {
      assert.ok(UUID_REGEX.test(g.id));
      assert.strictEqual(typeof g.brand, 'string');
      assert.strictEqual(typeof g.pointCost, 'number');
    }
  });
});
