/**
 * Authentication tests — login, JWT contract, auth middleware, and user scoping.
 * Best practices: fixed test secret, generic error messages, no sensitive data in tokens.
 */
const { createApp } = require('../src/app');
const assert = require('node:assert');
const { describe, it } = require('node:test');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { residents } = require('../src/data/mockData');

// Use same secret as api.test.js so tokens verify regardless of test file order
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
const TEST_SECRET = process.env.JWT_SECRET;

const app = createApp();

function decodeToken(token) {
  const [, payloadBase64] = token.split('.');
  return JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
}

function makeToken(payload, options = {}) {
  return jwt.sign(
    { userId: payload.userId, username: payload.username, role: payload.role },
    TEST_SECRET,
    { expiresIn: options.expiresIn ?? '1h' }
  );
}

function makeExpiredToken(payload) {
  return jwt.sign(
    { userId: payload.userId, username: payload.username, role: payload.role },
    TEST_SECRET,
    { expiresIn: '-1h' }
  );
}

describe('POST /api/auth/login', () => {
  describe('success', () => {
    it('returns 200 and a token for valid resident credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nate.craddock', password: 'resident16' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(typeof res.body.token, 'string');
      assert.ok(res.body.token.length > 0);
    });

    it('returns 200 and a token for valid admin credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin@casa1' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(typeof res.body.token, 'string');
    });

    it('accepts username case-insensitively', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'Admin', password: 'admin@casa1' });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.token);
    });

    it('returned token payload contains userId, username, role and exp (no password)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nate.craddock', password: 'resident16' });
      const payload = decodeToken(res.body.token);
      assert.ok(payload.userId);
      assert.strictEqual(payload.username, 'nate.craddock');
      assert.strictEqual(payload.role, 'resident');
      assert.ok(typeof payload.exp === 'number');
      assert.ok(typeof payload.iat === 'number');
      assert.strictEqual(payload.password, undefined);
      assert.strictEqual(payload.passwordHash, undefined);
    });

    it('token exp is approximately 1 hour from now', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nate.craddock', password: 'resident16' });
      const payload = decodeToken(res.body.token);
      const now = Math.floor(Date.now() / 1000);
      const oneHour = 3600;
      assert.ok(payload.exp >= now + oneHour - 60, 'exp should be at least ~1h from now');
      assert.ok(payload.exp <= now + oneHour + 60, 'exp should be at most ~1h from now');
    });
  });

  describe('validation (400)', () => {
    it('returns 400 with errors array for empty body', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      assert.strictEqual(res.status, 400);
      assert.ok(Array.isArray(res.body.errors));
      assert.ok(res.body.errors.length >= 1);
    });

    it('returns 400 when username is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'resident16' });
      assert.strictEqual(res.status, 400);
      assert.ok(Array.isArray(res.body.errors));
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nate.craddock' });
      assert.strictEqual(res.status, 400);
      assert.ok(Array.isArray(res.body.errors));
    });

    it('returns 400 when username is empty string', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: '', password: 'x' });
      assert.strictEqual(res.status, 400);
      assert.ok(Array.isArray(res.body.errors));
    });

    it('returns 400 when password is empty string', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nate.craddock', password: '' });
      assert.strictEqual(res.status, 400);
      assert.ok(Array.isArray(res.body.errors));
    });
  });

  describe('authentication failure (401)', () => {
    it('returns 401 with generic message for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nate.craddock', password: 'wrongpassword' });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.message, 'Invalid credentials');
    });

    it('returns 401 with same generic message for non-existent username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent.user', password: 'any' });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.message, 'Invalid credentials');
    });

    it('does not reveal whether username or password was wrong', async () => {
      const wrongPassword = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nate.craddock', password: 'wrong' });
      const wrongUser = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nobody', password: 'resident16' });
      assert.strictEqual(wrongPassword.body.message, wrongUser.body.message);
      assert.strictEqual(wrongPassword.status, 401);
      assert.strictEqual(wrongUser.status, 401);
    });
  });
});

describe('Auth middleware — protected routes', () => {
  let validToken;
  it('obtains a token via login for subsequent tests', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nate.craddock', password: 'resident16' });
    assert.strictEqual(res.status, 200);
    validToken = res.body.token;
  });
  const protectedPaths = [
    { method: 'get', path: '/api/me' },
    { method: 'get', path: '/api/gift-cards' },
    { method: 'get', path: '/api/transactions' },
    { method: 'post', path: '/api/redemptions', body: {} }
  ];

  it('returns 401 when Authorization header is missing', async () => {
    for (const { method, path, body } of protectedPaths) {
      const req = request(app)[method](path);
      if (body && Object.keys(body).length) req.send(body);
      const res = await req;
      assert.strictEqual(res.status, 401, `Expected 401 for ${method.toUpperCase()} ${path} without token`);
      assert.ok(res.body.message === 'Unauthorized' || res.body.message === 'Invalid credentials');
    }
  });

  it('returns 401 when Authorization does not start with Bearer ', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', validToken);
    assert.strictEqual(res.status, 401);
  });

  it('returns 401 for malformed token', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', 'Bearer not.a.valid.jwt');
    assert.strictEqual(res.status, 401);
  });

  it('returns 401 for token signed with wrong secret', async () => {
    const wrongToken = jwt.sign(
      { userId: residents[0].id, username: residents[0].username, role: residents[0].role },
      'wrong_secret',
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${wrongToken}`);
    assert.strictEqual(res.status, 401);
  });

  it('returns 401 for expired token', async () => {
    const expired = makeExpiredToken(residents[0]);
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${expired}`);
    assert.strictEqual(res.status, 401);
  });

  it('allows access with valid token', async () => {
    assert.ok(validToken, 'validToken must be set by previous test');
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${validToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.username, 'nate.craddock');
  });
});

describe('Public routes — no token required', () => {
  it('GET /health is accessible without token', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, { status: 'ok' });
  });

  it('POST /api/auth/login is accessible without token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nate.craddock', password: 'resident16' });
    assert.strictEqual(res.status, 200);
  });
});

describe('User scoping — data isolated by userId from token', () => {
  const nate = residents.find((r) => r.username === 'nate.craddock');
  const jeremy = residents.find((r) => r.username === 'jeremy.aguillon');

  it('GET /api/me returns profile for the authenticated user only', async () => {
    const loginNate = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nate.craddock', password: 'resident16' });
    const loginJeremy = await request(app)
      .post('/api/auth/login')
      .send({ username: 'jeremy.aguillon', password: 'resident17' });
    assert.strictEqual(loginNate.status, 200);
    assert.strictEqual(loginJeremy.status, 200);
    const resNate = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${loginNate.body.token}`);
    const resJeremy = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${loginJeremy.body.token}`);
    assert.strictEqual(resNate.status, 200);
    assert.strictEqual(resJeremy.status, 200);
    assert.strictEqual(resNate.body.username, 'nate.craddock');
    assert.strictEqual(resNate.body.fullName, 'Nate Craddock');
    assert.strictEqual(resJeremy.body.username, 'jeremy.aguillon');
    assert.strictEqual(resJeremy.body.fullName, 'Jeremy Aguillon');
    assert.notStrictEqual(resNate.body.id, resJeremy.body.id);
  });

  it('GET /api/transactions returns only transactions for the authenticated user', async () => {
    const loginNate = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nate.craddock', password: 'resident16' });
    const loginJeremy = await request(app)
      .post('/api/auth/login')
      .send({ username: 'jeremy.aguillon', password: 'resident17' });
    assert.strictEqual(loginNate.status, 200);
    assert.strictEqual(loginJeremy.status, 200);
    const resNate = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${loginNate.body.token}`);
    const resJeremy = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${loginJeremy.body.token}`);
    assert.strictEqual(resNate.status, 200);
    assert.strictEqual(resJeremy.status, 200);
    const nateIds = new Set(resNate.body.data.map((t) => t.residentId));
    const jeremyIds = new Set(resJeremy.body.data.map((t) => t.residentId));
    assert.strictEqual(nateIds.size, 1);
    assert.strictEqual(jeremyIds.size, 1);
    assert.strictEqual([...nateIds][0], nate.id);
    assert.strictEqual([...jeremyIds][0], jeremy.id);
  });
});
