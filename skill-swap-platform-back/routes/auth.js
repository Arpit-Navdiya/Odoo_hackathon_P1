const express = require("express")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const User = require("../models/User")
const ActivityLog = require("../models/ActivityLog")
const { protect, logActivity } = require("../middleware/auth")
const { validateRegister, validateLogin } = require("../middleware/validation")
const { sendEmail } = require("../utils/email")

const router = express.Router()

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  })
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", validateRegister, async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      })
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    })

    // Log activity
    await ActivityLog.create({
      user: user._id,
      action: "account_created",
      details: { email },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })

    // Populate skills for response
    await user.populate("skillsOffered.skill", "name category")
    await user.populate("skillsWanted.skill", "name category")

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
        location: user.location,
        skillsOffered: user.skillsOffered,
        skillsWanted: user.skillsWanted,
        availability: user.availability,
        isPublic: user.isPublic,
        rating: user.rating,
      },
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post("/login", validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Check for user
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check if user is banned
    if (user.status === "banned") {
      return res.status(403).json({
        success: false,
        message: "Account has been banned",
      })
    }

    // Log activity
    await ActivityLog.create({
      user: user._id,
      action: "login",
      details: { email },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })

    // Populate skills for response
    await user.populate("skillsOffered.skill", "name category")
    await user.populate("skillsWanted.skill", "name category")

    // Generate token
    const token = generateToken(user._id)

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
        location: user.location,
        skillsOffered: user.skillsOffered,
        skillsWanted: user.skillsWanted,
        availability: user.availability,
        isPublic: user.isPublic,
        rating: user.rating,
      },
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("skillsOffered.skill", "name category")
      .populate("skillsWanted.skill", "name category")

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post("/logout", protect, logActivity("logout"), async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with that email",
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex")
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000 // 10 minutes

    await user.save({ validateBeforeSave: false })

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/reset-password/${resetToken}`

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`

    try {
      await sendEmail({
        email: user.email,
        subject: "Password reset token",
        message,
      })

      res.status(200).json({
        success: true,
        message: "Email sent",
      })
    } catch (error) {
      user.passwordResetToken = undefined
      user.passwordResetExpires = undefined
      await user.save({ validateBeforeSave: false })

      return res.status(500).json({
        success: false,
        message: "Email could not be sent",
      })
    }
  } catch (error) {
    next(error)
  }
})

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
router.put("/reset-password/:resettoken", async (req, res, next) => {
  try {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.resettoken).digest("hex")

    const user = await User.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid token",
      })
    }

    // Set new password
    user.password = req.body.password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    // Log activity
    await ActivityLog.create({
      user: user._id,
      action: "password_changed",
      details: { method: "reset" },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })

    const token = generateToken(user._id)

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      token,
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
