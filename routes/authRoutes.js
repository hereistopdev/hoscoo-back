const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Sign Up Route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ token, userId: user._id, name, email });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Sign In Route
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Unregistered user" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);
    res.status(200).json({ token, userId: user._id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Password Reset Request Route
router.post("/reset-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "No user found with this email" });

    // Generate a reset token
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset token via email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request from Hoscoo",
      text: `To reset your password, please click the following link: ${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Reset token sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Password Reset Route
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Validate input
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.userId,
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

    // Hash the new password
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
