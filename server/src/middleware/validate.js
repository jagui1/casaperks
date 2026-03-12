/**
 * Returns an Express middleware that validates req.body or req.query with a Zod schema.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'} source - Which part of the request to validate
 * @returns {express.RequestHandler}
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : req.body;
    const result = schema.safeParse(data);
    if (result.success) {
      if (source === 'body') {
        req.body = result.data;
      } else if (source === 'query') {
        req.validatedQuery = result.data;
      }
      return next();
    }
    const errors = result.error.errors.map((e) => e.message).filter(Boolean);
    if (errors.length === 0) {
      errors.push(result.error.message || 'Validation failed');
    }
    return res.status(400).json({ errors });
  };
}

module.exports = { validate };
