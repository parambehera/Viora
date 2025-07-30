const jwt = require("jsonwebtoken");
require("dotenv").config(); 

const authMiddleware=(req, res, next)=> {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user; // attach user to request
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
}
module.exports = { authMiddleware };