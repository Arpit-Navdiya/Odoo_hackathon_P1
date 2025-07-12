const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

// Import models
const User = require("../models/User")
const Skill = require("../models/Skill")
const SwapRequest = require("../models/SwapRequest")

// Connect to database
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/skillswap")

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({})
    await Skill.deleteMany({})
    await SwapRequest.deleteMany({})

    console.log("Cleared existing data")

    // Create skills
    const skills = [
      { name: "JavaScript", category: "programming", status: "approved" },
      { name: "Python", category: "programming", status: "approved" },
      { name: "React", category: "programming", status: "approved" },
      { name: "Node.js", category: "programming", status: "approved" },
      { name: "UI/UX Design", category: "design", status: "approved" },
      { name: "Figma", category: "design", status: "approved" },
      { name: "Digital Marketing", category: "marketing", status: "approved" },
      { name: "SEO", category: "marketing", status: "approved" },
      { name: "Machine Learning", category: "programming", status: "approved" },
      { name: "DevOps", category: "programming", status: "approved" },
      { name: "Photography", category: "photography", status: "approved" },
      { name: "Content Writing", category: "writing", status: "approved" },
    ]

    const createdSkills = await Skill.insertMany(
      skills.map((skill) => ({
        ...skill,
        submittedBy: new mongoose.Types.ObjectId(),
        description: `Learn ${skill.name} from experienced professionals`,
      })),
    )

    console.log("Created skills")

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12)
    const admin = await User.create({
      name: "Admin User",
      email: "admin@skillswap.com",
      password: adminPassword,
      role: "admin",
      status: "active",
    })

    // Create regular users
    const userPassword = await bcrypt.hash("user123", 12)
    const users = [
      {
        name: "Alice Johnson",
        email: "alice@example.com",
        password: userPassword,
        location: "San Francisco, CA",
        skillsOffered: [
          { skill: createdSkills[1]._id, proficiencyLevel: "expert" }, // Python
          { skill: createdSkills[8]._id, proficiencyLevel: "advanced" }, // Machine Learning
        ],
        skillsWanted: [
          { skill: createdSkills[0]._id, urgency: "high" }, // JavaScript
          { skill: createdSkills[2]._id, urgency: "medium" }, // React
        ],
        availability: ["evenings", "weekends"],
        isPublic: true,
        rating: { average: 4.8, count: 12 },
      },
      {
        name: "Bob Smith",
        email: "bob@example.com",
        password: userPassword,
        location: "New York, NY",
        skillsOffered: [
          { skill: createdSkills[0]._id, proficiencyLevel: "expert" }, // JavaScript
          { skill: createdSkills[2]._id, proficiencyLevel: "advanced" }, // React
          { skill: createdSkills[3]._id, proficiencyLevel: "intermediate" }, // Node.js
        ],
        skillsWanted: [
          { skill: createdSkills[1]._id, urgency: "medium" }, // Python
          { skill: createdSkills[9]._id, urgency: "high" }, // DevOps
        ],
        availability: ["weekdays", "evenings"],
        isPublic: true,
        rating: { average: 4.6, count: 8 },
      },
      {
        name: "Carol Davis",
        email: "carol@example.com",
        password: userPassword,
        location: "Los Angeles, CA",
        skillsOffered: [
          { skill: createdSkills[4]._id, proficiencyLevel: "expert" }, // UI/UX Design
          { skill: createdSkills[5]._id, proficiencyLevel: "advanced" }, // Figma
        ],
        skillsWanted: [
          { skill: createdSkills[0]._id, urgency: "medium" }, // JavaScript
          { skill: createdSkills[11]._id, urgency: "low" }, // Content Writing
        ],
        availability: ["weekends"],
        isPublic: true,
        rating: { average: 4.9, count: 15 },
      },
      {
        name: "David Wilson",
        email: "david@example.com",
        password: userPassword,
        location: "Seattle, WA",
        skillsOffered: [
          { skill: createdSkills[9]._id, proficiencyLevel: "expert" }, // DevOps
          { skill: createdSkills[3]._id, proficiencyLevel: "advanced" }, // Node.js
        ],
        skillsWanted: [
          { skill: createdSkills[8]._id, urgency: "high" }, // Machine Learning
          { skill: createdSkills[1]._id, urgency: "medium" }, // Python
        ],
        availability: ["evenings"],
        isPublic: true,
        rating: { average: 4.7, count: 10 },
      },
      {
        name: "Eva Martinez",
        email: "eva@example.com",
        password: userPassword,
        location: "Austin, TX",
        skillsOffered: [
          { skill: createdSkills[6]._id, proficiencyLevel: "expert" }, // Digital Marketing
          { skill: createdSkills[7]._id, proficiencyLevel: "advanced" }, // SEO
          { skill: createdSkills[11]._id, proficiencyLevel: "intermediate" }, // Content Writing
        ],
        skillsWanted: [
          { skill: createdSkills[4]._id, urgency: "medium" }, // UI/UX Design
          { skill: createdSkills[10]._id, urgency: "low" }, // Photography
        ],
        availability: ["weekdays", "weekends"],
        isPublic: true,
        rating: { average: 4.5, count: 6 },
      },
    ]

    const createdUsers = await User.insertMany(users)
    console.log("Created users")

    // Create some swap requests
    const swapRequests = [
      {
        fromUser: createdUsers[0]._id, // Alice
        toUser: createdUsers[1]._id, // Bob
        skillOffered: createdSkills[1]._id, // Python
        skillWanted: createdSkills[0]._id, // JavaScript
        message: "Hi! I'd love to learn JavaScript from you. I have 5 years of Python experience.",
        status: "pending",
      },
      {
        fromUser: createdUsers[1]._id, // Bob
        toUser: createdUsers[3]._id, // David
        skillOffered: createdSkills[2]._id, // React
        skillWanted: createdSkills[9]._id, // DevOps
        message: "I'm interested in learning DevOps practices. Can teach React in return.",
        status: "accepted",
        acceptedAt: new Date(),
      },
      {
        fromUser: createdUsers[2]._id, // Carol
        toUser: createdUsers[1]._id, // Bob
        skillOffered: createdSkills[4]._id, // UI/UX Design
        skillWanted: createdSkills[3]._id, // Node.js
        message: "Would love to learn backend development!",
        status: "rejected",
      },
    ]

    await SwapRequest.insertMany(swapRequests)
    console.log("Created swap requests")

    // Update skill popularity
    for (const skill of createdSkills) {
      await skill.updatePopularity()
    }

    console.log("Database seeded successfully!")
    console.log("\nDemo accounts:")
    console.log("Admin: admin@skillswap.com / admin123")
    console.log("User: alice@example.com / user123")
    console.log("User: bob@example.com / user123")

    process.exit(0)
  } catch (error) {
    console.error("Error seeding database:", error)
    process.exit(1)
  }
}

seedDatabase()
