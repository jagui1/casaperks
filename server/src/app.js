const express = require('express');
const cors = require('cors');
const giftCardsRouter = require('./routes/giftCards');
const meRouter = require('./routes/me');
const transactionsRouter = require('./routes/transactions');
const authRouter = require('./routes/auth');
const redemptionsRouter = require('./routes/redemptions');
const { authMiddleware } = require('./middleware/authMiddleware');

function createApp() {
  const app = express();
  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Public auth route
  app.use('/api/auth', authRouter);

  // All routes below this line require a valid JWT
  app.use(authMiddleware);

  app.use('/api/gift-cards', giftCardsRouter);
  app.use('/api/me', meRouter);
  app.use('/api/transactions', transactionsRouter);
  app.use('/api/redemptions', redemptionsRouter);

  return app;
}

module.exports = { createApp };
