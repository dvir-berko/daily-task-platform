const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const twilio = require('twilio');
const db = require('../db/database');
const { requireAuth, signToken } = require('../middleware/auth');

const router = express.Router();

// ── Google OAuth Strategy ─────────────────────────────────────────────────────
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID_NOT_SET',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET_NOT_SET',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost/api/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    const googleId = profile.id;
    const name = profile.displayName || email;
    const avatar = profile.photos?.[0]?.value;

    // First user in the system becomes admin; or if email matches ADMIN_EMAIL
    const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
    const isAdminEmail = process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
    const role = (userCount === 0 || isAdminEmail) ? 'admin' : 'user';

    db.prepare(`
      INSERT INTO users (google_id, email, name, avatar, role, google_access_token, google_refresh_token)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(google_id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        avatar = excluded.avatar,
        google_access_token = excluded.google_access_token,
        google_refresh_token = COALESCE(excluded.google_refresh_token, google_refresh_token),
        calendar_connected = CASE WHEN excluded.google_access_token IS NOT NULL THEN 1 ELSE calendar_connected END,
        updated_at = datetime('now')
    `).run(googleId, email, name, avatar, role, accessToken, refreshToken || null);

    const user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

// ── Google OAuth Routes ───────────────────────────────────────────────────────
// Start flow — add ?calendar=1 to request calendar scope
router.get('/google', (req, res, next) => {
  const scopes = ['profile', 'email'];
  if (req.query.calendar === '1') {
    scopes.push('https://www.googleapis.com/auth/calendar');
  }
  passport.authenticate('google', {
    scope: scopes,
    accessType: 'offline',
    prompt: 'consent',
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth' }),
  (req, res) => {
    const token = signToken(req.user);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost';
    res.redirect(`${clientUrl}/?token=${token}`);
  }
);

// ── WhatsApp OTP Routes ───────────────────────────────────────────────────────
router.post('/whatsapp/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    return res.status(503).json({ error: 'WhatsApp/Twilio not configured on this server' });
  }

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Invalidate old OTPs for this number
  db.prepare('UPDATE otps SET used = 1 WHERE phone = ?').run(phone);
  db.prepare('INSERT INTO otps (phone, code, expires_at) VALUES (?, ?, ?)').run(phone, code, expiresAt);

  try {
    const client = twilio(sid, token);
    const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
      to,
      body: `🔐 Your DailyTask code: *${code}*\n\nExpires in 5 minutes. Do not share this code.`,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: `Failed to send OTP: ${err.message}` });
  }
});

router.post('/whatsapp/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });

  const otp = db.prepare(`
    SELECT * FROM otps
    WHERE phone = ? AND code = ? AND used = 0
      AND datetime(expires_at) > datetime('now')
    ORDER BY id DESC LIMIT 1
  `).get(phone, code);

  if (!otp) return res.status(400).json({ error: 'Invalid or expired code' });

  db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(otp.id);

  // Find or create user by WhatsApp phone number
  let user = db.prepare('SELECT * FROM users WHERE whatsapp_to = ?').get(phone);
  if (!user) {
    const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
    const role = userCount === 0 ? 'admin' : 'user';
    const result = db.prepare(
      'INSERT INTO users (email, name, whatsapp_to, role) VALUES (?, ?, ?, ?)'
    ).run(`${phone.replace(/[^0-9]/g, '')}@whatsapp.local`, phone, phone, role);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, role: user.role },
  });
});

// ── Profile Routes ────────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare(
    'SELECT id, email, name, avatar, role, whatsapp_to, reminder_time, reminder_enabled, email_reminders, calendar_connected, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.post('/logout', (req, res) => {
  // JWT is stateless — client just drops the token
  res.json({ success: true });
});

module.exports = router;