const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getUsers,
  createUser,
  getUser,
  getUsersWithAppointments,
} = require("../controllers/userController");

const router = express.Router();

router.get("/me", authMiddleware(), getUser);
router.get("/with-appointments", getUsersWithAppointments);
router.get("/", getUsers); 
router.post("/", createUser); 

module.exports = router;
