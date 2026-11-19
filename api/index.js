const express = require('express');
const pool = require('./db');
const currentUser = require('./middleware/currentUser');

const app = express();
app.use(express.json());
app.use(currentUser);
app.use('/items', require('./routes/item'));

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch (err) {
    console.error(err);
    res.status(503).json({ status: 'error', db: 'down' });
  }
});

const port = 3000;
app.listen(port, () => console.log(`api listening on ${port}`));
