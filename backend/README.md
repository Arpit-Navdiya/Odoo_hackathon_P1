# Skill Swap Platform - Backend API

A comprehensive Node.js backend API for the Skill Swap Platform, built with Express.js and MongoDB.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Password reset functionality
  - Account verification

- **User Management**
  - Profile management with skills and availability
  - Public/private profile settings
  - User rating system
  - Activity logging

- **Skill System**
  - Skill creation and categorization
  - Admin moderation workflow
  - Skill popularity tracking
  - Search and filtering

- **Swap Requests**
  - Create, accept, reject swap requests
  - Real-time notifications
  - Rating and feedback system
  - Request history and status tracking

- **Admin Dashboard**
  - User management (ban/unban)
  - Skill moderation
  - Broadcast messaging
  - Analytics and reporting
  - Data export (CSV/JSON)

- **File Upload**
  - Profile photo upload via Cloudinary
  - Image optimization and transformation

- **Real-time Features**
  - Socket.io integration
  - Live notifications
  - Real-time updates

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Real-time**: Socket.io
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Copy environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Configure your environment variables in `.env`

5. Seed the database:
   \`\`\`bash
   npm run seed
   \`\`\`

6. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password

### Users
- `GET /api/users` - Get all public users (with filtering)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/skills` - Add skill to user
- `DELETE /api/users/skills/:skillId` - Remove skill from user
- `PUT /api/users/change-password` - Change password

### Skills
- `GET /api/skills` - Get all approved skills
- `GET /api/skills/:id` - Get skill by ID
- `POST /api/skills` - Create new skill
- `GET /api/skills/meta/categories` - Get skill categories
- `GET /api/skills/meta/popular` - Get popular skills

### Swap Requests
- `GET /api/swaps` - Get user's swap requests
- `POST /api/swaps` - Create swap request
- `GET /api/swaps/:id` - Get swap request by ID
- `PUT /api/swaps/:id/accept` - Accept swap request
- `PUT /api/swaps/:id/reject` - Reject swap request
- `PUT /api/swaps/:id/complete` - Complete swap with rating
- `DELETE /api/swaps/:id` - Cancel swap request

### Admin
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/users` - Get all users for admin
- `PUT /api/admin/users/:id/status` - Ban/unban user
- `GET /api/admin/swaps` - Get all swap requests
- `GET /api/admin/skills` - Get skills for moderation
- `PUT /api/admin/skills/:id/moderate` - Approve/reject skill
- `POST /api/admin/broadcast` - Send broadcast message
- `GET /api/admin/broadcast` - Get broadcast messages
- `POST /api/admin/reports` - Generate reports

### Upload
- `POST /api/upload/profile-photo` - Upload profile photo

## Database Models

### User
- Personal information (name, email, location)
- Skills offered and wanted
- Availability preferences
- Rating and feedback
- Account status and preferences

### Skill
- Skill information and categorization
- Moderation status and flags
- Popularity metrics
- Submission tracking

### SwapRequest
- Request details and participants
- Skill exchange information
- Status tracking and timestamps
- Rating and feedback system

### BroadcastMessage
- Admin messaging system
- Target audience configuration
- Delivery tracking

### ActivityLog
- User activity tracking
- Security and audit logging
- Automatic cleanup (TTL)

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Role-based access control

## Environment Variables

See `.env.example` for all required environment variables.

## Demo Accounts

After running the seed script:
- **Admin**: admin@skillswap.com / admin123
- **User**: alice@example.com / user123
- **User**: bob@example.com / user123

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with demo data
- `npm test` - Run tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
