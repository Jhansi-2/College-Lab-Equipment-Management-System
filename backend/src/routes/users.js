const router = require('express').Router();
const db = require('../../db');

router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, name, email, role, created_at FROM users ORDER BY user_id DESC');
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Could not load users.' });
  }
});

router.post('/', async (req, res) => {
  const { name, email, role } = req.body;
  const allowed = ['Student', 'Staff', 'Faculty', 'Admin'];
  if (!name?.trim() || !email?.trim() || !allowed.includes(role))
    return res.status(400).json({ success: false, message: 'Enter name, email and a valid role.' });
  try {
    const [result] = await db.query(
      'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), role]
    );
    res.status(201).json({ success: true, id: result.insertId, message: 'User added.' });
  } catch (e) {
    const duplicate = e.code === 'ER_DUP_ENTRY';
    res.status(duplicate ? 409 : 500).json({ success: false, message: duplicate ? 'This email is already registered.' : 'Could not add user.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM users WHERE user_id=?', [Number(req.params.id)]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User deleted.' });
  } catch (e) {
    res.status(409).json({ success: false, message: 'Cannot delete a user with issue history.' });
  }
});

module.exports = router;
