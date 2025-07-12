const { body, validationResult } = require("express-validator")

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    })
  }
  next()
}

const validateRegister = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  handleValidationErrors,
]

const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
]

const validateSwapRequest = [
  body("toUser").isMongoId().withMessage("Invalid user ID"),
  body("skillOffered").isMongoId().withMessage("Invalid skill ID"),
  body("skillWanted").isMongoId().withMessage("Invalid skill ID"),
  body("message").optional().isLength({ max: 1000 }).withMessage("Message cannot exceed 1000 characters"),
  handleValidationErrors,
]

const validateSkill = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Skill name must be between 2 and 100 characters"),
  body("category")
    .isIn([
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
    ])
    .withMessage("Invalid category"),
  body("description").optional().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
  handleValidationErrors,
]

module.exports = {
  validateRegister,
  validateLogin,
  validateSwapRequest,
  validateSkill,
  handleValidationErrors,
}
