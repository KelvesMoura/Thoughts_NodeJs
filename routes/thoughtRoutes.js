const express = require("express");
const router = express.Router();

const ThoughtController = require("../controllers/ThoughtController");

const checkAuth = require("../helpers/auth").checkAuth;

router.use(checkAuth);

router.get("/dashboard", ThoughtController.show);
router.get("/add", ThoughtController.createThought);
router.post("/add", ThoughtController.createThoughtPost);
router.post("/delete", ThoughtController.deleteThought);
router.get("/edit/:id", ThoughtController.editThought);
router.post("/edit", ThoughtController.editThoughtPost);

module.exports = router;

// Caso não faça o router.use(checkAuth), tenho que declarar rota individualmente por rota
// router.get("/dashboard", checkAuth, ThoughtController.show);
