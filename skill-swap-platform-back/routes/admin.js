const express = require("express")
const User = require("../models/User")
const Skill = require("../models/Skill")
const SwapRequest = require("../models/SwapRequest")
const BroadcastMessage = require("../models/BroadcastMessage")
const ActivityLog = require("../models/ActivityLog")
const { protect, authorize, logActivity } = require("../middleware/auth")
const { Parser } = require("json2csv")
const moment = require("moment")

const router = express.Router()

// Apply admin authorization to all routes
router.use(protect)
router.use(authorize("admin"))

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get("/dashboard", async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ status: "active" })
    const bannedUsers = await User.countDocuments({ status: "banned" })

    const totalSwaps = await SwapRequest.countDocuments()
    const pendingSwaps = await SwapRequest.countDocuments({ status: "pending" })
    const completedSwaps = await SwapRequest.countDocuments({ status: "completed" })

    const totalSkills = await Skill.countDocuments()
    const pendingSkills = await Skill.countDocuments({ status: "pending" })
    const flaggedSkills = await Skill.countDocuments({ flagged: true })

    // Recent activity
    const recentSwaps = await SwapRequest.find()
      .populate("fromUser", "name")
      .populate("toUser", "name")
      .populate("skillOffered", "name")
      .populate("skillWanted", "name")
      .sort({ createdAt: -1 })
      .limit(5)

    const recentUsers = await User.find({ status: "active" })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .limit(5)

    res.status(200).json({
      success: true,
      stats: {
        users: { total: totalUsers, active: activeUsers, banned: bannedUsers },
        swaps: { total: totalSwaps, pending: pendingSwaps, completed: completedSwaps },
        skills: { total: totalSkills, pending: pendingSkills, flagged: flaggedSkills },
      },
      recentActivity: {
        swaps: recentSwaps,
        users: recentUsers,
      },
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get all users for admin
// @route   GET /api/admin/users
// @access  Private/Admin
router.get("/users", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, sortBy = "createdAt", sortOrder = "desc" } = req.query

    const query = { role: "user" } // Only show regular users, exclude admins

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
    }

    if (status && status !== "all") {
      query.status = status
    }

    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 }

    const users = await User.find(query)
      .select("-password")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await User.countDocuments(query)

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      users,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Ban/Unban user
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put("/users/:id/status", logActivity("user_status_change"), async (req, res, next) => {
  try {
    const { status } = req.body

    if (!["active", "banned", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      })
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true }).select(
      "-password",
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      message: `User ${status} successfully`,
      user,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get all swap requests for admin
// @route   GET /api/admin/swaps
// @access  Private/Admin
router.get("/swaps", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, dateFrom, dateTo, search } = req.query

    const query = {}

    if (status && status !== "all") {
      query.status = status
    }

    if (dateFrom || dateTo) {
      query.createdAt = {}
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom)
      if (dateTo) query.createdAt.$lte = new Date(dateTo)
    }

    const swaps = await SwapRequest.find(query)
      .populate("fromUser", "name email")
      .populate("toUser", "name email")
      .populate("skillOffered", "name category")
      .populate("skillWanted", "name category")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await SwapRequest.countDocuments(query)

    res.status(200).json({
      success: true,
      count: swaps.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      swaps,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get skills for moderation
// @route   GET /api/admin/skills
// @access  Private/Admin
router.get("/skills", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = "pending", flagged } = req.query

    const query = {}

    if (status !== "all") {
      query.status = status
    }

    if (flagged === "true") {
      query.flagged = true
    }

    const skills = await Skill.find(query)
      .populate("submittedBy", "name email")
      .populate("moderatedBy", "name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Skill.countDocuments(query)

    res.status(200).json({
      success: true,
      count: skills.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      skills,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Moderate skill (approve/reject)
// @route   PUT /api/admin/skills/:id/moderate
// @access  Private/Admin
router.put("/skills/:id/moderate", logActivity("skill_moderation"), async (req, res, next) => {
  try {
    const { action, reason } = req.body

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      })
    }

    const skill = await Skill.findById(req.params.id)

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      })
    }

    skill.status = action === "approve" ? "approved" : "rejected"
    skill.moderatedBy = req.user.id
    skill.moderatedAt = new Date()

    if (action === "reject" && reason) {
      skill.flagReason = reason
    }

    await skill.save()

    res.status(200).json({
      success: true,
      message: `Skill ${action}d successfully`,
      skill,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Send broadcast message
// @route   POST /api/admin/broadcast
// @access  Private/Admin
router.post("/broadcast", logActivity("broadcast_message"), async (req, res, next) => {
  try {
    const { title, message, type, priority, targetAudience } = req.body

    // Get target users based on audience
    const userQuery = { status: "active" }

    switch (targetAudience) {
      case "new_users":
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        userQuery.createdAt = { $gte: thirtyDaysAgo }
        break
      case "active_users":
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        userQuery.lastActive = { $gte: sevenDaysAgo }
        break
      // 'all' and 'premium_users' use default query
    }

    const recipientCount = await User.countDocuments(userQuery)

    const broadcastMessage = await BroadcastMessage.create({
      title,
      message,
      type,
      priority,
      targetAudience,
      sentBy: req.user.id,
      recipientCount,
    })

    // Send real-time notifications to all connected users
    const io = req.app.get("io")
    io.emit("broadcastMessage", {
      id: broadcastMessage._id,
      title,
      message,
      type,
      priority,
    })

    res.status(201).json({
      success: true,
      message: "Broadcast message sent successfully",
      broadcastMessage,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get broadcast messages
// @route   GET /api/admin/broadcast
// @access  Private/Admin
router.get("/broadcast", async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query

    const messages = await BroadcastMessage.find()
      .populate("sentBy", "name")
      .sort({ sentAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await BroadcastMessage.countDocuments()

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      messages,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Generate and download reports
// @route   POST /api/admin/reports
// @access  Private/Admin
router.post("/reports", async (req, res, next) => {
  try {
    const { reportType, format, dateFrom, dateTo } = req.body

    let data = []
    let filename = ""

    const dateFilter = {}
    if (dateFrom) dateFilter.$gte = new Date(dateFrom)
    if (dateTo) dateFilter.$lte = new Date(dateTo)

    switch (reportType) {
      case "user-activity":
        const activityLogs = await ActivityLog.find(dateFilter.createdAt ? { timestamp: dateFilter } : {})
          .populate("user", "name email")
          .sort({ timestamp: -1 })

        data = activityLogs.map((log) => ({
          user: log.user?.name || "Unknown",
          email: log.user?.email || "Unknown",
          action: log.action,
          timestamp: moment(log.timestamp).format("YYYY-MM-DD HH:mm:ss"),
          ipAddress: log.ipAddress,
        }))
        filename = "user-activity-report"
        break

      case "swap-feedback":
        const completedSwaps = await SwapRequest.find({
          status: "completed",
          ...(dateFilter.createdAt && { completedAt: dateFilter }),
        }).populate("fromUser toUser", "name email")

        data = completedSwaps.map((swap) => ({
          fromUser: swap.fromUser.name,
          toUser: swap.toUser.name,
          fromUserRating: swap.rating.fromUserRating,
          toUserRating: swap.rating.toUserRating,
          fromUserFeedback: swap.rating.fromUserFeedback,
          toUserFeedback: swap.rating.toUserFeedback,
          completedAt: moment(swap.completedAt).format("YYYY-MM-DD"),
        }))
        filename = "swap-feedback-report"
        break

      case "swap-statistics":
        const swapStats = await SwapRequest.aggregate([
          {
            $match: dateFilter.createdAt ? { createdAt: dateFilter } : {},
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ])

        data = swapStats.map((stat) => ({
          status: stat._id,
          count: stat.count,
        }))
        filename = "swap-statistics-report"
        break

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type",
        })
    }

    if (format === "csv") {
      const parser = new Parser()
      const csv = parser.parse(data)

      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`)
      res.send(csv)
    } else {
      res.status(200).json({
        success: true,
        data,
        count: data.length,
      })
    }
  } catch (error) {
    next(error)
  }
})

module.exports = router
