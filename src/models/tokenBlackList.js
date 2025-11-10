const mongoose = require("mongoose");

const tokenBlacklistSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model("TokenBlacklist", tokenBlacklistSchema);
