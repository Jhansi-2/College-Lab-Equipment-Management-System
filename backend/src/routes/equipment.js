const router = require('express').Router();
const db = require('../../db');

router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM equipment ORDER BY equipment_id DESC');
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Could not load equipment.' });
  }
});

router.post('/', async (req, res) => {
  const { name, category } = req.body;
  const quantity = Number(req.body.quantity);
  if (!name?.trim() || !category?.trim() || !Number.isInteger(quantity) || quantity < 0)
    return res.status(400).json({ success: false, message: 'Enter a name, category and valid quantity.' });
  try {
    const status = quantity > 0 ? 'Available' : 'Out of Stock';
    const [result] = await db.query(
      'INSERT INTO equipment (name, category, quantity, available_quantity, status) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), category.trim(), quantity, quantity, status]
    );
    res.status(201).json({ success: true, id: result.insertId, message: 'Equipment added.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Could not add equipment.' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, category } = req.body;
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(id) || !name?.trim() || !category?.trim() || !Number.isInteger(quantity) || quantity < 0)
    return res.status(400).json({ success: false, message: 'Invalid equipment details.' });
  try {
    const [rows] = await db.query('SELECT quantity, available_quantity FROM equipment WHERE equipment_id=?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Equipment not found.' });
    const alreadyIssued = rows[0].quantity - rows[0].available_quantity;
    if (quantity < alreadyIssued) return res.status(400).json({ success: false, message: 'Total quantity cannot be less than the quantity currently issued.' });
    const available = quantity - alreadyIssued;
    await db.query(
      'UPDATE equipment SET name=?, category=?, quantity=?, available_quantity=?, status=? WHERE equipment_id=?',
      [name.trim(), category.trim(), quantity, available, available > 0 ? 'Available' : 'Out of Stock', id]
    );
    res.json({ success: true, message: 'Equipment updated.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Could not update equipment.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM equipment WHERE equipment_id=?', [Number(req.params.id)]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Equipment not found.' });
    res.json({ success: true, message: 'Equipment deleted.' });
  } catch (e) {
    res.status(409).json({ success: false, message: 'Cannot delete equipment with issue history.' });
  }
});

module.exports = router;
