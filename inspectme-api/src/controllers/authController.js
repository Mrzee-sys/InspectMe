const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/jwt");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required." });
  }

  const user = await User.findOne({ username: username.trim() });

  if (!user || !user.active) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = signToken({
    userId: String(user._id),
    role: user.role,
    username: user.username,
  });

  await AuditLog.create({
    user: user._id,
    action: "LOGIN",
    entity: "User",
    entityId: String(user._id),
  });

  return res.json({
    token,
    user: {
      id: String(user._id),
      username: user.username,
      role: user.role,
      active: user.active,
      mustChangePassword: user.mustChangePassword,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("username role active mustChangePassword createdDate");

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json(user);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required." });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters." });
  }

  const user = await User.findById(req.user.id);

  if (!user || !user.active) {
    return res.status(404).json({ message: "User not found." });
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Current password is incorrect." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  await user.save();

  await AuditLog.create({
    user: user._id,
    action: "CHANGE_PASSWORD",
    entity: "User",
    entityId: String(user._id),
  });

  return res.json({
    message: "Password updated successfully.",
    user: {
      id: String(user._id),
      username: user.username,
      role: user.role,
      active: user.active,
      mustChangePassword: user.mustChangePassword,
    },
  });
});

module.exports = {
  login,
  me,
  changePassword,
};
