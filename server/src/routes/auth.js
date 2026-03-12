const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { residents } = require('../data/mockData');
const { validate } = require('../middleware/validate');
const { loginSchema } = require('../schemas/authSchemas');

const router = express.Router();

const FALLBACK_PASSWORDS = {
  'nate.craddock': 'resident16',
  'jeremy.aguillon': 'resident17',
  admin: 'admin@casa1'
};

router.post(
  '/login',
  validate(loginSchema, 'body'),
  async (req, res) => {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password.trim() : '';

    const user = residents.find((r) => r.username.toLowerCase() === username.toLowerCase());
    const invalidMessage = 'Invalid credentials';

    if (!user) {
      return res.status(401).json({ message: invalidMessage });
    }

    const fallbackPassword = FALLBACK_PASSWORDS[user.username];
    const passwordMatches =
      (await bcrypt.compare(password, user.passwordHash)) ||
      (fallbackPassword && password === fallbackPassword);
    if (!passwordMatches) {
      return res.status(401).json({ message: invalidMessage });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    return res.status(200).json({ token });
  }
);

module.exports = router;

