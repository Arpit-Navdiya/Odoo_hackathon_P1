const express = require("express")
const multer = require("multer")
const cloudinary = require("cloudinary").v2
const { protect } = require("../middleware/auth")

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

// @desc    Upload profile photo
// @route   POST /api/upload/profile-photo
// @access  Private
router.post("/profile-photo", protect, upload.single("photo"), async (req, res, next) => {
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
    const User = require("../models/User")
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

module.exports = router
