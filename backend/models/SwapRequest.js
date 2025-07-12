const mongoose = require("mongoose")

const swapRequestSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skillOffered: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
    },
    skillWanted: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
    },
    message: {
      type: String,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    responseMessage: {
      type: String,
      maxlength: [1000, "Response message cannot exceed 1000 characters"],
    },
    acceptedAt: Date,
    completedAt: Date,
    rating: {
      fromUserRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      toUserRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      fromUserFeedback: String,
      toUserFeedback: String,
    },
    sessionDetails: {
      scheduledDate: Date,
      duration: Number, // in minutes
      platform: String, // zoom, meet, in-person, etc.
      notes: String,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
swapRequestSchema.index({ fromUser: 1, status: 1 })
swapRequestSchema.index({ toUser: 1, status: 1 })
swapRequestSchema.index({ status: 1, createdAt: -1 })
swapRequestSchema.index({ skillOffered: 1 })
swapRequestSchema.index({ skillWanted: 1 })

// Prevent duplicate requests
swapRequestSchema.index(
  {
    fromUser: 1,
    toUser: 1,
    skillOffered: 1,
    skillWanted: 1,
  },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "accepted"] } },
  },
)

// Update user ratings when swap is completed with rating
swapRequestSchema.post("save", async (doc) => {
  if (doc.status === "completed" && doc.rating.fromUserRating && doc.rating.toUserRating) {
    const User = mongoose.model("User")

    // Update toUser rating (received rating from fromUser)
    const toUser = await User.findById(doc.toUser)
    if (toUser) {
      const newCount = toUser.rating.count + 1
      const newAverage = (toUser.rating.average * toUser.rating.count + doc.rating.fromUserRating) / newCount

      toUser.rating.average = Math.round(newAverage * 10) / 10
      toUser.rating.count = newCount
      await toUser.save()
    }

    // Update fromUser rating (received rating from toUser)
    const fromUser = await User.findById(doc.fromUser)
    if (fromUser) {
      const newCount = fromUser.rating.count + 1
      const newAverage = (fromUser.rating.average * fromUser.rating.count + doc.rating.toUserRating) / newCount

      fromUser.rating.average = Math.round(newAverage * 10) / 10
      fromUser.rating.count = newCount
      await fromUser.save()
    }
  }
})

module.exports = mongoose.model("SwapRequest", swapRequestSchema)
