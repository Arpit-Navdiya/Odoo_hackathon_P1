const mongoose = require("mongoose")

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Skill name is required"],
      unique: true,
      trim: true,
      maxlength: [100, "Skill name cannot exceed 100 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "programming",
        "design",
        "marketing",
        "business",
        "language",
        "music",
        "art",
        "cooking",
        "fitness",
        "photography",
        "writing",
        "other",
      ],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    moderatedAt: Date,
    flagged: {
      type: Boolean,
      default: false,
    },
    flagReason: String,
    popularity: {
      offeredCount: {
        type: Number,
        default: 0,
      },
      wantedCount: {
        type: Number,
        default: 0,
      },
    },
    tags: [String],
  },
  {
    timestamps: true,
  },
)

// Index for better search performance
skillSchema.index({ name: "text", description: "text" })
skillSchema.index({ category: 1 })
skillSchema.index({ status: 1 })
skillSchema.index({ "popularity.offeredCount": -1 })
skillSchema.index({ "popularity.wantedCount": -1 })

// Update popularity counts
skillSchema.methods.updatePopularity = async function () {
  const User = mongoose.model("User")

  const offeredCount = await User.countDocuments({
    "skillsOffered.skill": this._id,
  })

  const wantedCount = await User.countDocuments({
    "skillsWanted.skill": this._id,
  })

  this.popularity.offeredCount = offeredCount
  this.popularity.wantedCount = wantedCount

  return this.save()
}

module.exports = mongoose.model("Skill", skillSchema)
