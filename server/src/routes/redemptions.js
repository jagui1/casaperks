const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Phase 3 stub: protected endpoint, full business logic added in Phase 4.
router.post('/', authMiddleware, (req, res) => {
  return res.status(501).json({ message: 'Redemptions not implemented yet' });
});

module.exports = router;

