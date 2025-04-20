import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Token from "../models/Token.js";
import { protect } from "../middleware/auth.js";
import nodemailer from "nodemailer";
import { sendEmail } from "../utils/emailService.js";

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const {
      sapId,
      username,
      name,
      email,
      password,
      role,
      department,
      skills,
      resumeUrl,
    } = req.body;

    // Check if user already exists by email
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Role-specific validations and checks
    if (role === "student") {
      // Check if student with SAP ID exists
      if (!sapId) {
        return res
          .status(400)
          .json({ message: "SAP ID is required for students" });
      }

      const sapIdExists = await User.findOne({ sapId });
      if (sapIdExists) {
        return res
          .status(400)
          .json({ message: "User with this SAP ID already exists" });
      }

      if (!department) {
        return res
          .status(400)
          .json({ message: "Department is required for students" });
      }
    } else if (role === "faculty") {
      // Check if faculty with username exists
      if (!username) {
        return res
          .status(400)
          .json({ message: "Username is required for faculty" });
      }

      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res
          .status(400)
          .json({ message: "User with this username already exists" });
      }

      if (!department) {
        return res
          .status(400)
          .json({ message: "Department is required for faculty" });
      }
    }

    // Create user object based on role
    const userData = {
      name,
      email,
      password,
      role,
    };

    // Add role-specific fields
    if (role === "student") {
      userData.sapId = sapId;
      userData.department = department;
      userData.skills = skills || [];
      userData.resumeUrl = resumeUrl || null;
    } else if (role === "faculty") {
      userData.username = username;
      userData.department = department;
    }

    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        team: user.team,
        skills: user.skills,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Check for user by either SAP ID, username or email
    const user = await User.findOne({
      $or: [
        { sapId: identifier },
        { username: identifier },
        { email: identifier },
      ],
    });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        sapId: user.sapId,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        team: user.team,
        skills: user.skills,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    // Fetch the user with populated team data
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate({
        path: "team",
        populate: {
          path: "project",
          select: "title description status startDate endDate",
        },
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist" });
    }

    // Delete any existing tokens for this user
    await Token.deleteMany({ userId: user._id, type: "reset_password" });

    // Create reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token to database
    await Token.create({
      userId: user._id,
      token: hashedToken,
      type: "reset_password",
      createdAt: Date.now(),
    });

    // Create reset URL - use FRONTEND_URL env var or default to localhost
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password/${resetToken}`;

    // Create email message
    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your IPD Portal account.</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>The link will expire in 1 hour.</p>
    `;

    // Send email using the email service
    const emailResult = await sendEmail({
      to: user.email,
      subject: "IPD Portal - Password Reset",
      html: message,
    });

    if (emailResult.success) {
      // If in development and we have a preview URL, include it in response
      if (process.env.NODE_ENV !== "production" && emailResult.previewUrl) {
        return res.status(200).json({
          message: "Password reset email sent",
          previewUrl: emailResult.previewUrl,
          resetToken, // Only included in development
        });
      }

      return res.status(200).json({ message: "Password reset email sent" });
    } else {
      // If email sending failed but we're in development, provide direct token
      if (process.env.NODE_ENV !== "production") {
        return res.status(200).json({
          message:
            "Email sending failed in development mode. Use direct reset link:",
          resetUrl,
          resetToken,
        });
      }

      // In production, return an error
      return res
        .status(500)
        .json({ message: "Failed to send password reset email" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/auth/reset-password/:token
// @desc    Verify reset token
// @access  Public
router.get("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token from params
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Look for the token in the database
    const tokenDoc = await Token.findOne({
      token: hashedToken,
      type: "reset_password",
    });

    if (!tokenDoc) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    res.status(200).json({ message: "Valid token" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    // Hash the token from params
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find the token in the database
    const tokenDoc = await Token.findOne({
      token: hashedToken,
      type: "reset_password",
    });

    if (!tokenDoc) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Find the user
    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Set new password and save user
    user.password = password;
    await user.save();

    // Delete the token
    await Token.deleteOne({ _id: tokenDoc._id });

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
