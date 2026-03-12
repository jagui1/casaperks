const { z } = require('zod');

const uuidSchema = z.string().uuid('giftCardId must be a valid UUID');

const redemptionBodySchema = z.object({
  giftCardId: uuidSchema
});

module.exports = {
  redemptionBodySchema
};
