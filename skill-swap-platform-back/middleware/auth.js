const jwt = require("jsonwebtoken")
const User = require("../models/User")
const ActivityLog = require("../models/ActivityLog")

const protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select("-password")

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "No user found with this token",
        })
      }

      if (user.status === "banned") {
        return res.status(403).json({
          success: false,
          message: "Account has been banned",
        })
      }

      req.user = user

      // Update last active timestamp
      user.updateLastActive()

      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      })
    }
  } catch (error) {
    next(error)
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      })
    }
    next()
  }
}

const logActivity = (action) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        await ActivityLog.create({
          user: req.user._id,
          action,
          details: {
            endpoint: req.originalUrl,
            method: req.method,
            body: req.body,
          },
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        })
      }
      next()
    } catch (error) {
      // Don't fail the request if logging fails
      console.error("Activity logging error:", error)
      next()
    }
  }
}

module.exports = { protect, authorize, logActivity }
