const express = require('express');
const { randomUUID } = require('node:crypto');
const { residents, transactions: allTransactions, giftCards } = require('../data/mockData');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { redemptionBodySchema } = require('../schemas/redemptionSchemas');

const router = express.Router();

router.post('/', validate(redemptionBodySchema, 'body'), (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { giftCardId } = req.body;

  const giftCard = giftCards.find((g) => g.id === giftCardId);
  if (!giftCard) {
    return res.status(404).json({ message: 'Gift card not found' });
  }

  const resident = residents.find((r) => r.id === userId);
  if (!resident) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (resident.pointsBalance < giftCard.pointCost) {
    return res.status(422).json({
      message: 'Insufficient points',
      pointsBalance: resident.pointsBalance,
      required: giftCard.pointCost
    });
  }

  resident.pointsBalance -= giftCard.pointCost;

  const newTransaction = {
    id: randomUUID(),
    residentId: userId,
    type: 'redemption',
    description: `Redeemed: ${giftCard.brand} Gift Card`,
    points: -giftCard.pointCost,
    createdAt: new Date().toISOString()
  };
  allTransactions.push(newTransaction);

  return res.status(200).json({
    pointsBalance: resident.pointsBalance
  });
});

module.exports = router;
