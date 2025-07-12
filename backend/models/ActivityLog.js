const mongoose = require("mongoose")

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "profile_update",
        "skill_add",
        "skill_remove",
        "swap_request_sent",
        "swap_request_accepted",
        "swap_request_rejected",
        "swap_completed",
        "rating_given",
        "account_created",
        "password_changed",
      ],
    },
    details: {
      type: Object,
      default: {},
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
activityLogSchema.index({ user: 1, timestamp: -1 })
activityLogSchema.index({ action: 1, timestamp: -1 })
activityLogSchema.index({ timestamp: -1 })

// TTL index to automatically delete old logs after 1 year
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 })

module.exports = mongoose.model("ActivityLog", activityLogSchema)
