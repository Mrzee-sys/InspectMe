const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Authorization token is required." });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).lean();

    if (!user || !user.active) {
      return res.status(401).json({ message: "Invalid or inactive user." });
    }

    req.user = {
      id: String(user._id),
      username: user.username,
      role: user.role,
      active: user.active,
    };

    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication is required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied for this role." });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
