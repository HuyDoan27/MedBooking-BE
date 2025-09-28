const express = require("express");
const { getUsers, createUser } = require("../controllers/userController");

const router = express.Router();

router.get("/", getUsers);   // GET /api/users
router.post("/", createUser); // POST /api/users

module.exports = router;
