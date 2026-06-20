const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — no token' });
  }
  try {
    req.user = jwt.verify(header.slice(7), SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, avatar: user.avatar, role: user.role },
    SECRET,
    { expiresIn: '30d' }
  );
}

module.exports = { requireAuth, requireAdmin, signToken };