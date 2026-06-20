const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/categories
router.get('/', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(t.id) as task_count
    FROM categories c
    LEFT JOIN tasks t ON t.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `).all();
  res.json(categories);
});

// POST /api/categories
router.post('/', (req, res) => {
  const { name, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  try {
    const result = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)').run(name.trim(), color || '#6366f1');
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(cat);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Category already exists' });
    throw e;
  }
});

// PUT /api/categories/:id
router.put('/:id', (req, res) => {
  const { name, color } = req.body;
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  db.prepare('UPDATE categories SET name = ?, color = ? WHERE id = ?').run(name ?? cat.name, color ?? cat.color, req.params.id);
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id));
});

// DELETE /api/categories/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });
  res.json({ success: true });
});

module.exports = router;
