/**
 * Validation middleware tests. Phase 3/4 will reuse this middleware for login and redemptions.
 */
const assert = require('node:assert');
const { describe, it } = require('node:test');
const { validate } = require('../src/middleware/validate');
const { z } = require('zod');

const schema = z.object({
  page: z.number().min(1),
  limit: z.number().max(50)
});

describe('validate(schema, "query")', () => {
  it('calls next() when data is valid', () => {
    const middleware = validate(schema, 'query');
    const req = { query: { page: 1, limit: 10 } };
    const res = {};
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    middleware(req, res, next);
    assert.strictEqual(nextCalled, true);
  });

  it('returns 400 with errors array when data is invalid', () => {
    const middleware = validate(schema, 'query');
    const req = { query: { page: 0, limit: 10 } };
    let capturedBody;
    const res = {
      status(code) {
        assert.strictEqual(code, 400);
        return this;
      },
      json(body) {
        capturedBody = body;
      }
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    middleware(req, res, next);
    assert.strictEqual(nextCalled, false);
    assert.ok(Array.isArray(capturedBody.errors));
    assert.ok(capturedBody.errors.length >= 1);
  });
});

describe('validate(schema, "body")', () => {
  it('assigns parsed body to req.body on success', () => {
    const bodySchema = z.object({ name: z.string() });
    const middleware = validate(bodySchema, 'body');
    const req = { body: { name: 'Jane' } };
    const res = {};
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    middleware(req, res, next);
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.body.name, 'Jane');
  });
});
