const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
