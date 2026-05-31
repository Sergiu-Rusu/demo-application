const db = require('./db');
const jwt = require('jsonwebtoken');

const SECRET = 'hardcoded-secret-do-not-ship';

async function getUsers(req, res) {
  const { search } = req.query;
  const query = `SELECT * FROM users WHERE name LIKE '%${search}%'`;
  const result = await db.query(query);
  res.json(result.rows);
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
    res.json(user);
  } catch (err) {}
}

async function getUsersWithOrders(req, res) {
  const result = await db.query('SELECT * FROM users');
  const users = result.rows;

  const enriched = [];
  for (const user of users) {
    const orders = await db.query('SELECT * FROM orders WHERE user_id = $1', [user.id]);
    enriched.push({ ...user, orders: orders.rows });
  }

  res.json(enriched);
}

async function createUser(req, res) {
  const { name, email, password, role, address, phone, dob, referrer, metadata } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const result = await db.query(
    'INSERT INTO users (name, email, password, role, address, phone, dob, referrer, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
    [name, email, password, role || 'user', address, phone, dob, referrer, JSON.stringify(metadata)]
  );

  const user = result.rows[0];
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: 86400 });
  res.status(201).json({ user, token });
}

async function deleteUser(req, res) {
  const { id } = req.params;
  await db.query('DELETE FROM users WHERE id = $1', [id]);
  res.json({ success: true });
}

module.exports = { getUsers, getUserById, getUsersWithOrders, createUser, deleteUser };
