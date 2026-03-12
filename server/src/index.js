const express = require('express');

const PORT = process.env.PORT || 3001;

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});

