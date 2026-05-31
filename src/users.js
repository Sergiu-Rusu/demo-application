const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('./config');

async function getUsers(req, res) {
  try {
    const { search } = req.query;
    const result = await db.query("SELECT * FROM users WHERE name LIKE $1", [`%${search}%`]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getUsersWithOrders(req, res) {
  try {
    const result = await db.query('SELECT * FROM users');
    const users = result.rows;

    const enriched = await Promise.all(
      users.map(async (user) => {
        const orders = await db.query('SELECT * FROM orders WHERE user_id = $1', [user.id]);
        return { ...user, orders: orders.rows };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role, address, phone, dob, referrer, metadata } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      'INSERT INTO users (name, email, password, role, address, phone, dob, referrer, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name, email, hashedPassword, role || 'user', address, phone, dob, referrer, JSON.stringify(metadata)]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const isOwner = String(req.user.id) === String(id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getUsers, getUserById, getUsersWithOrders, createUser, deleteUser };
