const express = require("express")
const { protect, logActivity } = require("../middleware/auth")
const User = require("../models/User")
const Skill = require("../models/Skill")
const multer = require("multer")
const cloudinary = require("cloudinary").v2

const router = express.Router()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"), false)
    }
  },
})

// @desc    Get all public users with filtering
// @route   GET /api/users
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 12, search, availability, skillCategory, location } = req.query

    // Build query
    const query = { isPublic: true, status: "active" }

    // Search in name and skills
    if (search) {
      const skills = await Skill.find({
        $or: [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }],
      }).select("_id")

      const skillIds = skills.map((skill) => skill._id)

      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "skillsOffered.skill": { $in: skillIds } },
        { "skillsWanted.skill": { $in: skillIds } },
      ]
    }

    // Filter by availability
    if (availability && availability !== "All Availability") {
      query.availability = { $in: [availability.toLowerCase()] }
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: "i" }
    }

    // Execute query with pagination
    const users = await User.find(query)
      .populate("skillsOffered.skill", "name category")
      .populate("skillsWanted.skill", "name category")
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ lastActive: -1 })

    // Get total count for pagination
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

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("skillsOffered.skill", "name category description")
      .populate("skillsWanted.skill", "name category description")
      .select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Only return public profiles or own profile
    if (!user.isPublic && (!req.user || req.user.id !== user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: "Profile is private",
      })
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put("/profile", protect, logActivity("profile_update"), async (req, res, next) => {
  try {
    const { name, location, skillsOffered, skillsWanted, availability, isPublic } = req.body

    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Update fields
    if (name) user.name = name
    if (location !== undefined) user.location = location
    if (availability) user.availability = availability
    if (isPublic !== undefined) user.isPublic = isPublic

    // Handle skills offered
    if (skillsOffered) {
      user.skillsOffered = []
      for (const skillData of skillsOffered) {
        if (typeof skillData === "string") {
          // If it's a skill name, find or create the skill
          let skill = await Skill.findOne({ name: skillData })
          if (!skill) {
            try {
              skill = await Skill.create({
                name: skillData,
                category: "other",
                submittedBy: req.user.id,
                status: "approved"
              })
            } catch (createError) {
              // Handle duplicate key error - skill was created by another user
              if (createError.code === 11000) {
                skill = await Skill.findOne({ name: skillData })
                if (!skill) {
                  continue // Skip this skill if we can't find or create it
                }
              } else {
                throw createError
              }
            }
          }
          user.skillsOffered.push({
            skill: skill._id,
            proficiencyLevel: "intermediate",
          })
        } else {
          // If it's an object with skill ID
          user.skillsOffered.push(skillData)
        }
      }
    }

    // Handle skills wanted
    if (skillsWanted) {
      user.skillsWanted = []
      for (const skillData of skillsWanted) {
        if (typeof skillData === "string") {
          let skill = await Skill.findOne({ name: skillData })
          if (!skill) {
            try {
              skill = await Skill.create({
                name: skillData,
                category: "other",
                submittedBy: req.user.id,
                status: "approved"
              })
            } catch (createError) {
              // Handle duplicate key error - skill was created by another user
              if (createError.code === 11000) {
                skill = await Skill.findOne({ name: skillData })
                if (!skill) {
                  continue // Skip this skill if we can't find or create it
                }
              } else {
                throw createError
              }
            }
          }
          user.skillsWanted.push({
            skill: skill._id,
            urgency: "medium",
          })
        } else {
          user.skillsWanted.push(skillData)
        }
      }
    }

    await user.save()

    // Populate skills for response
    await user.populate("skillsOffered.skill", "name category")
    await user.populate("skillsWanted.skill", "name category")

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Add skill to user
// @route   POST /api/users/skills
// @access  Private
router.post("/skills", protect, logActivity("skill_add"), async (req, res, next) => {
  try {
    const { skillName, type, proficiencyLevel, urgency, category } = req.body

    // Find existing skill by name (regardless of status)
    let skill = await Skill.findOne({ name: skillName })

    if (!skill) {
      // Create new skill only if it doesn't exist
      try {
        skill = await Skill.create({
          name: skillName,
          category: category || "other",
          submittedBy: req.user.id,
          status: "approved" // Set to approved for user-created skills
        })
      } catch (createError) {
        // Handle duplicate key error - skill was created by another user
        if (createError.code === 11000) {
          skill = await Skill.findOne({ name: skillName })
          if (!skill) {
            return res.status(500).json({
              success: false,
              message: "Failed to create or find skill",
            })
          }
        } else {
          throw createError
        }
      }
    }

    const user = await User.findById(req.user.id)

    if (type === "offered") {
      // Check if skill already exists in user's offered skills
      const existingSkill = user.skillsOffered.find((s) => s.skill.toString() === skill._id.toString())

      if (!existingSkill) {
        user.skillsOffered.push({
          skill: skill._id,
          proficiencyLevel: proficiencyLevel || "intermediate",
        })
      } else {
        return res.status(400).json({
          success: false,
          message: "Skill already exists in your offered skills",
        })
      }
    } else if (type === "wanted") {
      // Check if skill already exists in user's wanted skills
      const existingSkill = user.skillsWanted.find((s) => s.skill.toString() === skill._id.toString())

      if (!existingSkill) {
        user.skillsWanted.push({
          skill: skill._id,
          urgency: urgency || "medium",
        })
      } else {
        return res.status(400).json({
          success: false,
          message: "Skill already exists in your wanted skills",
        })
      }
    }

    await user.save()

    // Update skill popularity if the method exists
    if (skill.updatePopularity) {
      await skill.updatePopularity()
    }

    res.status(200).json({
      success: true,
      message: "Skill added successfully",
      skill,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Remove skill from user
// @route   DELETE /api/users/skills/:skillId
// @access  Private
router.delete("/skills/:skillId", protect, logActivity("skill_remove"), async (req, res, next) => {
  try {
    const { type } = req.query
    const user = await User.findById(req.user.id)

    if (type === "offered") {
      user.skillsOffered = user.skillsOffered.filter((s) => s.skill.toString() !== req.params.skillId)
    } else if (type === "wanted") {
      user.skillsWanted = user.skillsWanted.filter((s) => s.skill.toString() !== req.params.skillId)
    }

    await user.save()

    // Update skill popularity
    const skill = await Skill.findById(req.params.skillId)
    if (skill) {
      await skill.updatePopularity()
    }

    res.status(200).json({
      success: true,
      message: "Skill removed successfully",
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Upload profile photo
// @route   POST /api/users/profile-photo
// @access  Private
router.post("/profile-photo", protect, upload.single("photo"), logActivity("profile_photo_upload"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "skill-swap/profiles",
            public_id: `user-${req.user.id}-${Date.now()}`,
            transformation: [
              { width: 400, height: 400, crop: "fill", gravity: "face" },
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          },
        )
        .end(req.file.buffer)
    })

    // Update user profile with new photo URL
    await User.findByIdAndUpdate(req.user.id, {
      photo: result.secure_url,
    })

    res.status(200).json({
      success: true,
      message: "Photo uploaded successfully",
      photoUrl: result.secure_url,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
router.put("/change-password", protect, logActivity("password_changed"), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user.id).select("+password")

    // Check current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    user.password = newPassword
    await user.save()

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
