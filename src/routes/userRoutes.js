const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getUsers,
  createUser,
  getUser,
} = require("../controllers/userController");

const router = express.Router();

router.get("/me", authMiddleware(), getUser);
router.get("/", getUsers); // GET /api/users
router.post("/", createUser); // POST /api/users

module.exports = router;
