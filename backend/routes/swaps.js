const express = require("express")
const SwapRequest = require("../models/SwapRequest")
const User = require("../models/User")
const { protect, logActivity } = require("../middleware/auth")
const { validateSwapRequest } = require("../middleware/validation")
const { sendEmail } = require("../utils/email")

const router = express.Router()

// @desc    Get user's swap requests
// @route   GET /api/swaps
// @access  Private
router.get("/", protect, async (req, res, next) => {
  try {
    const { status, type = "all", page = 1, limit = 10 } = req.query

    const query = {}

    // Filter by type (sent, received, or all)
    if (type === "sent") {
      query.fromUser = req.user.id
    } else if (type === "received") {
      query.toUser = req.user.id
    } else {
      query.$or = [{ fromUser: req.user.id }, { toUser: req.user.id }]
    }

    // Filter by status
    if (status && status !== "all") {
      query.status = status
    }

    const swaps = await SwapRequest.find(query)
      .populate("fromUser", "name photo rating")
      .populate("toUser", "name photo rating")
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

// @desc    Create swap request
// @route   POST /api/swaps
// @access  Private
router.post("/", protect, validateSwapRequest, logActivity("swap_request_sent"), async (req, res, next) => {
  try {
    const { toUser, skillOffered, skillWanted, message } = req.body

    // Check if user is trying to request from themselves
    if (toUser === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot send swap request to yourself",
      })
    }

    // Check if target user exists and is active
    const targetUser = await User.findById(toUser)
    if (!targetUser || targetUser.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "User not found or inactive",
      })
    }

    // Check if similar request already exists
    const existingRequest = await SwapRequest.findOne({
      fromUser: req.user.id,
      toUser,
      skillOffered,
      skillWanted,
      status: { $in: ["pending", "accepted"] },
    })

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Similar swap request already exists",
      })
    }

    // Create swap request
    const swapRequest = await SwapRequest.create({
      fromUser: req.user.id,
      toUser,
      skillOffered,
      skillWanted,
      message,
    })

    // Populate the created request
    await swapRequest.populate("fromUser", "name photo")
    await swapRequest.populate("toUser", "name photo email")
    await swapRequest.populate("skillOffered", "name")
    await swapRequest.populate("skillWanted", "name")

    // Send email notification
    try {
      await sendEmail({
        email: swapRequest.toUser.email,
        subject: "New Skill Swap Request",
        message: `You have received a new skill swap request from ${swapRequest.fromUser.name}. They want to learn ${swapRequest.skillWanted.name} and offer ${swapRequest.skillOffered.name} in return.`,
      })
    } catch (emailError) {
      console.error("Email notification failed:", emailError)
    }

    // Send real-time notification
    const io = req.app.get("io")
    io.to(`user-${toUser}`).emit("newSwapRequest", {
      id: swapRequest._id,
      fromUser: swapRequest.fromUser,
      skillOffered: swapRequest.skillOffered,
      skillWanted: swapRequest.skillWanted,
      message: swapRequest.message,
    })

    res.status(201).json({
      success: true,
      message: "Swap request sent successfully",
      swapRequest,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get swap request by ID
// @route   GET /api/swaps/:id
// @access  Private
router.get("/:id", protect, async (req, res, next) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.id)
      .populate("fromUser", "name photo rating")
      .populate("toUser", "name photo rating")
      .populate("skillOffered", "name category description")
      .populate("skillWanted", "name category description")

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found",
      })
    }

    // Check if user is involved in this swap
    if (swapRequest.fromUser._id.toString() !== req.user.id && swapRequest.toUser._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this swap request",
      })
    }

    res.status(200).json({
      success: true,
      swapRequest,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Accept swap request
// @route   PUT /api/swaps/:id/accept
// @access  Private
router.put("/:id/accept", protect, logActivity("swap_request_accepted"), async (req, res, next) => {
  try {
    const { responseMessage } = req.body

    const swapRequest = await SwapRequest.findById(req.params.id)
      .populate("fromUser", "name email")
      .populate("toUser", "name email")
      .populate("skillOffered", "name")
      .populate("skillWanted", "name")

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found",
      })
    }

    // Check if user is the recipient
    if (swapRequest.toUser._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to accept this request",
      })
    }

    // Check if request is still pending
    if (swapRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request is no longer pending",
      })
    }

    // Update request
    swapRequest.status = "accepted"
    swapRequest.acceptedAt = new Date()
    swapRequest.responseMessage = responseMessage
    await swapRequest.save()

    // Send email notification
    try {
      await sendEmail({
        email: swapRequest.fromUser.email,
        subject: "Swap Request Accepted!",
        message: `Great news! ${swapRequest.toUser.name} has accepted your skill swap request for ${swapRequest.skillWanted.name}.`,
      })
    } catch (emailError) {
      console.error("Email notification failed:", emailError)
    }

    // Send real-time notification
    const io = req.app.get("io")
    io.to(`user-${swapRequest.fromUser._id}`).emit("swapRequestAccepted", {
      id: swapRequest._id,
      toUser: swapRequest.toUser,
      skillOffered: swapRequest.skillOffered,
      skillWanted: swapRequest.skillWanted,
    })

    res.status(200).json({
      success: true,
      message: "Swap request accepted",
      swapRequest,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Reject swap request
// @route   PUT /api/swaps/:id/reject
// @access  Private
router.put("/:id/reject", protect, logActivity("swap_request_rejected"), async (req, res, next) => {
  try {
    const { responseMessage } = req.body

    const swapRequest = await SwapRequest.findById(req.params.id)
      .populate("fromUser", "name email")
      .populate("toUser", "name email")

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found",
      })
    }

    // Check if user is the recipient
    if (swapRequest.toUser._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reject this request",
      })
    }

    // Check if request is still pending
    if (swapRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request is no longer pending",
      })
    }

    // Update request
    swapRequest.status = "rejected"
    swapRequest.responseMessage = responseMessage
    await swapRequest.save()

    // Send real-time notification
    const io = req.app.get("io")
    io.to(`user-${swapRequest.fromUser._id}`).emit("swapRequestRejected", {
      id: swapRequest._id,
      toUser: swapRequest.toUser,
    })

    res.status(200).json({
      success: true,
      message: "Swap request rejected",
      swapRequest,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Complete swap and add rating
// @route   PUT /api/swaps/:id/complete
// @access  Private
router.put("/:id/complete", protect, logActivity("swap_completed"), async (req, res, next) => {
  try {
    const { rating, feedback } = req.body

    const swapRequest = await SwapRequest.findById(req.params.id)

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found",
      })
    }

    // Check if user is involved in this swap
    const isFromUser = swapRequest.fromUser.toString() === req.user.id
    const isToUser = swapRequest.toUser.toString() === req.user.id

    if (!isFromUser && !isToUser) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this swap",
      })
    }

    // Check if swap is accepted
    if (swapRequest.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Swap must be accepted before completion",
      })
    }

    // Add rating and feedback
    if (isFromUser) {
      swapRequest.rating.fromUserRating = rating
      swapRequest.rating.fromUserFeedback = feedback
    } else {
      swapRequest.rating.toUserRating = rating
      swapRequest.rating.toUserFeedback = feedback
    }

    // If both users have rated, mark as completed
    if (swapRequest.rating.fromUserRating && swapRequest.rating.toUserRating) {
      swapRequest.status = "completed"
      swapRequest.completedAt = new Date()
    }

    await swapRequest.save()

    res.status(200).json({
      success: true,
      message: "Rating submitted successfully",
      swapRequest,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Cancel swap request
// @route   DELETE /api/swaps/:id
// @access  Private
router.delete("/:id", protect, async (req, res, next) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.id)

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found",
      })
    }

    // Check if user is the sender
    if (swapRequest.fromUser.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this request",
      })
    }

    // Can only cancel pending requests
    if (swapRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only cancel pending requests",
      })
    }

    await SwapRequest.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Swap request cancelled",
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
