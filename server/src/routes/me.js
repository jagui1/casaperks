const express = require('express');
const { residents } = require('../data/mockData');

const router = express.Router();

router.get('/', (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = residents.find((r) => r.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { passwordHash, ...profile } = user;
  res.status(200).json(profile);
});

module.exports = router;
