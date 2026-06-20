const nodemailer = require('nodemailer');
const db = require('../db/database');

function getTransporter() {
  if (!process.env.SMTP_USER) return null;
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendDigestEmail(userId) {
  const transporter = getTransporter();
  if (!transporter) return;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user || user.email_reminders !== 1 || user.email.includes('@whatsapp.local')) return;

  const tasks = db.prepare(`
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM tasks t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.status != 'done'
    ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, t.due_date ASC
  `).all(userId);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const overdue = tasks.filter(t => t.due_date && t.due_date < todayStr);
  const dueToday = tasks.filter(t => t.due_date === todayStr);
  const upcoming = tasks.filter(t => !t.due_date || t.due_date > todayStr);

  const taskRow = (t) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;font-size:14px">${t.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;">
        <span style="background:${{ high:'#450a0a', medium:'#1e1b4b', low:'#052e16' }[t.priority]};color:${{ high:'#f87171', medium:'#818cf8', low:'#4ade80' }[t.priority]};padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600">${t.priority}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px">${t.due_date || '—'}</td>
    </tr>
  `;

  const html = `
    <!DOCTYPE html><html><body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
    <div style="max-width:600px;margin:32px auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid #1e293b">
      
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center">
        <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:24px">✓</div>
        <h1 style="margin:0;color:white;font-size:24px;font-weight:700">Daily Task Digest</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:15px">${todayLabel}</p>
      </div>

      <div style="padding:24px">
        <p style="color:#94a3b8;margin:0 0 24px">Hi ${user.name} 👋 Here's your task overview for today.</p>

        <div style="display:flex;gap:12px;margin-bottom:24px">
          <div style="flex:1;background:#1e293b;border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:28px;font-weight:700;color:#f87171">${overdue.length}</div>
            <div style="color:#94a3b8;font-size:13px;margin-top:4px">Overdue</div>
          </div>
          <div style="flex:1;background:#1e293b;border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:28px;font-weight:700;color:#818cf8">${dueToday.length}</div>
            <div style="color:#94a3b8;font-size:13px;margin-top:4px">Due Today</div>
          </div>
          <div style="flex:1;background:#1e293b;border-radius:10px;padding:16px;text-align:center">
            <div style="font-size:28px;font-weight:700;color:#4ade80">${tasks.length}</div>
            <div style="color:#94a3b8;font-size:13px;margin-top:4px">Total Pending</div>
          </div>
        </div>

        ${overdue.length > 0 ? `
          <div style="background:#450a0a;border:1px solid #7f1d1d;border-radius:10px;padding:16px;margin-bottom:16px">
            <h3 style="color:#f87171;margin:0 0 12px;font-size:15px">⚠️ Overdue Tasks (${overdue.length})</h3>
            <table style="width:100%;border-collapse:collapse">${overdue.map(taskRow).join('')}</table>
          </div>
        ` : ''}

        ${dueToday.length > 0 ? `
          <div style="background:#1e1b4b;border:1px solid #3730a3;border-radius:10px;padding:16px;margin-bottom:16px">
            <h3 style="color:#818cf8;margin:0 0 12px;font-size:15px">📅 Due Today (${dueToday.length})</h3>
            <table style="width:100%;border-collapse:collapse">${dueToday.map(taskRow).join('')}</table>
          </div>
        ` : ''}

        ${upcoming.length > 0 ? `
          <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px;margin-bottom:24px">
            <h3 style="color:#94a3b8;margin:0 0 12px;font-size:15px">📋 Upcoming (${upcoming.length})</h3>
            <table style="width:100%;border-collapse:collapse">${upcoming.slice(0,10).map(taskRow).join('')}</table>
            ${upcoming.length > 10 ? `<p style="color:#475569;font-size:13px;margin:8px 0 0">...and ${upcoming.length-10} more</p>` : ''}
          </div>
        ` : ''}

        <div style="text-align:center">
          <a href="${process.env.CLIENT_URL || 'http://localhost'}" style="display:inline-block;background:#4f46e5;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">Open DailyTask →</a>
        </div>
      </div>

      <div style="padding:16px 24px;border-top:1px solid #1e293b;text-align:center">
        <p style="color:#475569;font-size:12px;margin:0">DailyTask · Stay organized, stay productive 💪<br>To unsubscribe, disable email reminders in Settings.</p>
      </div>
    </div>
    </body></html>
  `;

  await transporter.sendMail({
    from: `"DailyTask" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: `📋 Daily Task Digest — ${todayLabel} (${tasks.length} pending)`,
    html,
  });

  console.log(`[Email] Digest sent to ${user.email}`);
}

async function sendDailyDigestToAll() {
  const users = db.prepare('SELECT id FROM users WHERE email_reminders = 1').all();
  for (const u of users) {
    try { await sendDigestEmail(u.id); }
    catch (err) { console.error(`[Email] Failed for user ${u.id}:`, err.message); }
  }
}

module.exports = { sendDigestEmail, sendDailyDigestToAll };