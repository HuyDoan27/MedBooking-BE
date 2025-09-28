const express = require("express");
const { getSpecialties } = require("../controllers/specialtiesController");

const router = express.Router();

router.get("/", getSpecialties);


module.exports = router;
