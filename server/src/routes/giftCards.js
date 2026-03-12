const express = require('express');
const { giftCards } = require('../data/mockData');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json(giftCards);
});

module.exports = router;
