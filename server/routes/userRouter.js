const express = require("express");
const { loginUser, registerUser,verifyUser } = require("../controller/userController");
const {authMiddleware} = require("../middleware/authMiddleware")

const router = express.Router();
router.route("/login").post(loginUser);
router.route("/register").post(registerUser);
router.route("/me").get(authMiddleware,verifyUser);

module.exports = router;