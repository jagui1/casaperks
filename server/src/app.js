const express = require('express');
const giftCardsRouter = require('./routes/giftCards');
const meRouter = require('./routes/me');
const transactionsRouter = require('./routes/transactions');

function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/gift-cards', giftCardsRouter);
  app.use('/api/me', meRouter);
  app.use('/api/transactions', transactionsRouter);

  return app;
}

module.exports = { createApp };
