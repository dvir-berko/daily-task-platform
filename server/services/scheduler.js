const cron = require('node-cron');
const db = require('../db/database');
const { sendDailyDigest } = require('./whatsapp');

let currentJob = null;

function parseTime(timeStr) {
  const [h, m] = (timeStr || '08:00').split(':').map(Number);
  return { hour: h, minute: m };
}

function buildCron(timeStr) {
  const { hour, minute } = parseTime(timeStr);
  return `${minute} ${hour} * * *`;
}

function startScheduler() {
  const settings = db.prepare('SELECT key, value FROM settings').all();
  const settingsMap = Object.fromEntries(settings.map(r => [r.key, r.value]));
  const time = settingsMap.reminder_time || '08:00';
  const tz = process.env.REMINDER_TIMEZONE || 'Asia/Jerusalem';

  if (currentJob) {
    currentJob.stop();
    currentJob = null;
  }

  if (settingsMap.reminder_enabled !== 'true') {
    console.log('[Scheduler] Reminders disabled');
    return;
  }

  const cronExpr = buildCron(time);
  console.log(`[Scheduler] Daily reminder set for ${time} (${tz}) — cron: ${cronExpr}`);

  currentJob = cron.schedule(cronExpr, async () => {
    console.log('[Scheduler] Sending daily digest...');
    try {
      await sendDailyDigest();
    } catch (err) {
      console.error('[Scheduler] Failed to send digest:', err.message);
    }
  }, { timezone: tz });
}

module.exports = { startScheduler };
