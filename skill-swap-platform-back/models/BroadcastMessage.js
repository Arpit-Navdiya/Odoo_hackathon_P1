const mongoose = require("mongoose")

const broadcastMessageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    type: {
      type: String,
      enum: ["announcement", "update", "maintenance", "promotion"],
      default: "announcement",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    targetAudience: {
      type: String,
      enum: ["all", "active_users", "new_users", "premium_users"],
      default: "all",
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "scheduled"],
      default: "sent",
    },
    scheduledFor: Date,
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
broadcastMessageSchema.index({ sentAt: -1 })
broadcastMessageSchema.index({ status: 1 })
broadcastMessageSchema.index({ targetAudience: 1 })

module.exports = mongoose.model("BroadcastMessage", broadcastMessageSchema)
