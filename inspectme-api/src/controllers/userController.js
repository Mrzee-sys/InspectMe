const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select("username role active mustChangePassword createdDate").sort({ username: 1 });
  return res.json(users);
});

const createUser = asyncHandler(async (req, res) => {
  const { username, password, role, active = true, mustChangePassword = true } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: "username, password, and role are required." });
  }

  const existingUser = await User.findOne({ username: username.trim() });
  if (existingUser) {
    return res.status(409).json({ message: "Username already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    username: username.trim(),
    passwordHash,
    role,
    active,
    mustChangePassword,
  });

  await AuditLog.create({
    user: req.user.id,
    action: "CREATE_USER",
    entity: "User",
    entityId: String(user._id),
  });

  return res.status(201).json({
    id: String(user._id),
    username: user.username,
    role: user.role,
    active: user.active,
    mustChangePassword: user.mustChangePassword,
    createdDate: user.createdDate,
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  if (typeof active !== "boolean") {
    return res.status(400).json({ message: "active must be a boolean." });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { active },
    { new: true, runValidators: true }
  ).select("username role active mustChangePassword createdDate");

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  await AuditLog.create({
    user: req.user.id,
    action: "UPDATE_USER_STATUS",
    entity: "User",
    entityId: id,
  });

  return res.json(user);
});

module.exports = {
  listUsers,
  createUser,
  updateUserStatus,
};
