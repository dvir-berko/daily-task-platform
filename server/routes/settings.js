const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { sendDailyDigest } = require('../services/whatsapp');
const { startScheduler } = require('../services/scheduler');

// GET /api/settings
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json(settings);
});

// PUT /api/settings
router.put('/', (req, res) => {
  const allowed = ['whatsapp_to', 'reminder_time', 'reminder_enabled'];
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const update = db.transaction((updates) => {
    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key)) upsert.run(key, String(value));
    }
  });
  update(req.body);

  // Restart scheduler so new reminder_time / reminder_enabled takes effect immediately
  startScheduler();

  const rows = db.prepare('SELECT key, value FROM settings').all();
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});

// POST /api/settings/test-whatsapp  — sends a test message
router.post('/test-whatsapp', async (req, res) => {
  try {
    await sendDailyDigest(true);
    res.json({ success: true, message: 'Test message sent!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;