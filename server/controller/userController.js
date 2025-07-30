const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const httpStatus = require("http-status");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const registerUser = async (req, res) => {
  const { name, username, password } = req.body;

  if (!username || !name || !password) {
    return res.status(400).json({ message: "Add valid credentials" });
  }

  try {
    const existingUser = await User.findOne({ username: username });

    if (existingUser) {
      return res.status(302).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser = new User({
      name: name,
      username: username,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: `Something went wrong: ${error.message}` });
  }
};

const loginUser = async (req, res) => {
  let { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "All fileds are required" });
  }
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credential" });
    }
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    user.token = token;
    await user.save();
    return res.status(200).json({ token: token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `something went wrong: ${error.message}` });
  }
};
const verifyUser = (req,res)=>{
  res.json({user:req.user})
}

module.exports = { registerUser, loginUser,verifyUser };
