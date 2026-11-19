const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /items: the household's needed items, newest first
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT items.id, items.name, items.quantity,
              users.name AS "requestedBy", items.created_at AS "createdAt"
         FROM items
         LEFT JOIN users ON users.id = items.requested_by
        WHERE items.household_id = $1 AND items.status = 'needed'
        ORDER BY items.created_at DESC`,
      [req.user.householdId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load items' });
  }
});

// POST /items: add an item to the household's list
router.post('/', async (req, res) => {
  const { name, quantity } = req.body;

  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    return res.status(400).json({ error: 'Name is required (max 100 characters)' });
  }
  if (quantity !== undefined && (typeof quantity !== 'string' || quantity.length > 50)) {
    return res.status(400).json({ error: 'Quantity must be text, max 50 characters' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO items (household_id, requested_by, name, quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, quantity, status, created_at AS "createdAt"`,
      [req.user.householdId, req.user.id, name.trim(), quantity ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    // 23505 = Postgres "unique rule broken": this item is already needed
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Already on the list' });
    }
    console.error(err);
    res.status(500).json({ error: 'Could not add item' });
  }
});

// PATCH /items/:id: mark an item bought
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE items
          SET status = 'bought', bought_by = $1, bought_at = now()
        WHERE id = $2 AND household_id = $3 AND status = 'needed'
        RETURNING id, name, quantity, status, bought_at AS "boughtAt"`,
      [req.user.id, id, req.user.householdId]
    );

    // no row changed: wrong id, another household's item, or already bought
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update item' });
  }
});

module.exports = router;
