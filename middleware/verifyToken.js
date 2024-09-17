const jwt = require("jsonwebtoken");

// Middleware to verify the JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  console.log(token);

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = verifyToken;
