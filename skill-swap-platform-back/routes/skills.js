const express = require("express")
const Skill = require("../models/Skill")
const { protect, authorize } = require("../middleware/auth")
const { validateSkill } = require("../middleware/validation")

const router = express.Router()

// @desc    Get all approved skills
// @route   GET /api/skills
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 50, category, search, sortBy = "popularity" } = req.query

    // Build query
    const query = { status: "approved" }

    if (category && category !== "all") {
      query.category = category
    }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    // Build sort
    let sort = {}
    switch (sortBy) {
      case "popularity":
        sort = { "popularity.offeredCount": -1, "popularity.wantedCount": -1 }
        break
      case "name":
        sort = { name: 1 }
        break
      case "recent":
        sort = { createdAt: -1 }
        break
      default:
        sort = { "popularity.offeredCount": -1 }
    }

    const skills = await Skill.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("submittedBy", "name")

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

// @desc    Get skill by ID
// @route   GET /api/skills/:id
// @access  Public
router.get("/:id", async (req, res, next) => {
  try {
    const skill = await Skill.findById(req.params.id).populate("submittedBy", "name").populate("moderatedBy", "name")

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      })
    }

    res.status(200).json({
      success: true,
      skill,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Create new skill
// @route   POST /api/skills
// @access  Private
router.post("/", protect, validateSkill, async (req, res, next) => {
  try {
    const { name, category, description, tags } = req.body

    // Check if skill already exists
    const existingSkill = await Skill.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    })

    if (existingSkill) {
      return res.status(400).json({
        success: false,
        message: "Skill already exists",
      })
    }

    const skill = await Skill.create({
      name,
      category,
      description,
      tags,
      submittedBy: req.user.id,
    })

    res.status(201).json({
      success: true,
      message: "Skill submitted for review",
      skill,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get skill categories
// @route   GET /api/skills/categories
// @access  Public
router.get("/meta/categories", async (req, res, next) => {
  try {
    const categories = [
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
    ]

    // Get count for each category
    const categoryCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await Skill.countDocuments({ category, status: "approved" })
        return { category, count }
      }),
    )

    res.status(200).json({
      success: true,
      categories: categoryCounts,
    })
  } catch (error) {
    next(error)
  }
})

// @desc    Get popular skills
// @route   GET /api/skills/popular
// @access  Public
router.get("/meta/popular", async (req, res, next) => {
  try {
    const { type = "offered", limit = 10 } = req.query

    const sortField = type === "offered" ? "popularity.offeredCount" : "popularity.wantedCount"

    const skills = await Skill.find({ status: "approved" })
      .sort({ [sortField]: -1 })
      .limit(Number.parseInt(limit))
      .select("name category popularity")

    res.status(200).json({
      success: true,
      skills,
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
