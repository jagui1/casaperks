const express = require('express');
const { residents } = require('../data/mockData');

const router = express.Router();

// Hard-coded to first resident (auth-based lookup in Phase 3)
const HARDCODED_USERNAME = 'nate.craddock';

router.get('/', (req, res) => {
  const user = residents.find((r) => r.username === HARDCODED_USERNAME);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const { passwordHash, ...profile } = user;
  res.status(200).json(profile);
});

module.exports = router;
