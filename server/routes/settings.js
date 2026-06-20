const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { startScheduler } = require('../services/scheduler');

router.use(requireAuth);

// GET /api/settings
router.get('/', (req, res) => {
  try {
    const user = db.prepare('SELECT reminder_time, reminder_enabled, email_reminders, whatsapp_to FROM users WHERE id = ?')
      .get(req.user.id);
    res.json(user || { reminder_time: '08:00', reminder_enabled: 1, email_reminders: 0, whatsapp_to: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', (req, res) => {
  try {
    const { reminder_time, reminder_enabled, email_reminders, whatsapp_to } = req.body;
    db.prepare(`
      UPDATE users SET
        reminder_time = COALESCE(?, reminder_time),
        reminder_enabled = COALESCE(?, reminder_enabled),
        email_reminders = COALESCE(?, email_reminders),
        whatsapp_to = COALESCE(?, whatsapp_to),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      reminder_time ?? null,
      reminder_enabled !== undefined ? (reminder_enabled ? 1 : 0) : null,
      email_reminders !== undefined ? (email_reminders ? 1 : 0) : null,
      whatsapp_to ?? null,
      req.user.id
    );
    const updated = db.prepare('SELECT reminder_time, reminder_enabled, email_reminders, whatsapp_to FROM users WHERE id = ?')
      .get(req.user.id);
    startScheduler();
    res.json(updated);
  } catch (err) {
    console.error('[Settings] PUT:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;