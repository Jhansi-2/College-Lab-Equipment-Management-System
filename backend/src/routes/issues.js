
const router = require('express').Router();
const db = require('../../db');

router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        i.issue_id,
        i.equipment_id,
        i.user_id,
        e.name AS equipment_name,
        u.name AS user_name,
        u.email,
        i.issue_date,
        i.due_date,
        i.return_date,
        i.quantity,
        i.status
      FROM issue_records i
      JOIN equipment e ON e.equipment_id = i.equipment_id
      JOIN users u ON u.user_id = i.user_id
      ORDER BY i.issue_id DESC
    `);

    res.json({ success: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: 'Could not load issue history.'
    });
  }
});

router.post('/', async (req, res) => {
  const equipmentId = Number(req.body.equipment_id);
  const userId = Number(req.body.user_id);
  const quantity = Number(req.body.quantity);
  const dueDate = req.body.due_date;

  if (
    !Number.isInteger(equipmentId) ||
    !Number.isInteger(userId) ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    return res.status(400).json({
      success: false,
      message: 'Select equipment, user and a valid quantity.'
    });
  }

  if (
    typeof dueDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Please select a valid due date.'
    });
  }

  const c = await db.getConnection();

  try {
    await c.beginTransaction();

    const [dateCheck] = await c.query(
      'SELECT ? < CURDATE() AS is_past',
      [dueDate]
    );

    if (dateCheck[0].is_past) {
      throw new Error('Due date cannot be in the past.');
    }

    const [eq] = await c.query(
      'SELECT available_quantity FROM equipment WHERE equipment_id = ? FOR UPDATE',
      [equipmentId]
    );

    if (!eq.length) {
      throw new Error('Equipment not found.');
    }

    if (eq[0].available_quantity < quantity) {
      throw new Error('Not enough equipment is available.');
    }

    const [users] = await c.query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [userId]
    );

    if (!users.length) {
      throw new Error('User not found.');
    }

    await c.query(
      `INSERT INTO issue_records
       (equipment_id, user_id, issue_date, due_date, quantity, status)
       VALUES (?, ?, CURDATE(), ?, ?, 'Issued')`,
      [equipmentId, userId, dueDate, quantity]
    );

    const remaining = eq[0].available_quantity - quantity;

    await c.query(
      'UPDATE equipment SET available_quantity = ?, status = ? WHERE equipment_id = ?',
      [
        remaining,
        remaining > 0 ? 'Available' : 'Out of Stock',
        equipmentId
      ]
    );

    await c.commit();

    res.status(201).json({
      success: true,
      message: 'Equipment issued successfully.'
    });
  } catch (e) {
    await c.rollback();
    console.error(e);

    res.status(400).json({
      success: false,
      message: e.message || 'Could not issue equipment.'
    });
  } finally {
    c.release();
  }
});

router.post('/:id/return', async (req, res) => {
  const issueId = Number(req.params.id);

  if (!Number.isInteger(issueId) || issueId < 1) {
    return res.status(400).json({
      success: false,
      message: 'Invalid issue ID.'
    });
  }

  const c = await db.getConnection();

  try {
    await c.beginTransaction();

    const [rows] = await c.query(
      `SELECT equipment_id, quantity
       FROM issue_records
       WHERE issue_id = ? AND status = 'Issued'
       FOR UPDATE`,
      [issueId]
    );

    if (!rows.length) {
      throw new Error('Active issue record not found.');
    }

    const row = rows[0];

    await c.query(
      "UPDATE issue_records SET status = 'Returned', return_date = CURDATE() WHERE issue_id = ?",
      [issueId]
    );

    await c.query(
      `UPDATE equipment
       SET available_quantity = available_quantity + ?,
           status = CASE
             WHEN available_quantity + ? >= quantity THEN 'Available'
             ELSE 'Available'
           END
       WHERE equipment_id = ?`,
      [row.quantity, row.quantity, row.equipment_id]
    );

    await c.commit();

    res.json({
      success: true,
      message: 'Equipment returned successfully.'
    });
  } catch (e) {
    await c.rollback();
    console.error(e);

    res.status(400).json({
      success: false,
      message: e.message || 'Could not return equipment.'
    });
  } finally {
    c.release();
  }
});

module.exports = router;
