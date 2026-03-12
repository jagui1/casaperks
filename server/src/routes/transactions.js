const express = require('express');
const { residents, transactions: allTransactions } = require('../data/mockData');
const { validate } = require('../middleware/validate');
const { transactionQuerySchema } = require('../schemas/transactionSchemas');

const router = express.Router();

router.get('/', validate(transactionQuerySchema, 'query'), (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = residents.find((r) => r.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { page = 1, limit = 10 } = req.validatedQuery || req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const filtered = allTransactions
    .filter((t) => t.residentId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = filtered.length;
  const start = (pageNum - 1) * limitNum;
  const data = filtered.slice(start, start + limitNum);
  res.status(200).json({ data, page: pageNum, limit: limitNum, total });
});

module.exports = router;
