# Authentication Integration

This document describes the authentication system integration between the frontend and backend.

## Features Implemented

### ✅ Login & Register API Integration

- **Login**: `POST /api/auth/login`
- **Register**: `POST /api/auth/register`
- **Token-based authentication** with JWT
- **Automatic token storage** in localStorage
- **Token synchronization** with API service

### ✅ State Management

- **Centralized auth state** in AuthProvider
- **Persistent sessions** across browser refreshes
- **Loading states** for better UX
- **Error handling** with user-friendly messages

### ✅ UI Components

- **Tabbed interface** for login/register
- **Form validation** (password matching, length requirements)
- **Password visibility toggles**
- **Loading spinners** during API calls
- **Error alerts** with dismiss functionality

## API Endpoints Used

### Authentication

```typescript
// Login
POST /api/auth/login
Body: { email: string, password: string }
Response: { success: boolean, token: string, user: User }

// Register
POST /api/auth/register
Body: { name: string, email: string, password: string }
Response: { success: boolean, token: string, user: User }
```

### User Management

```typescript
// Get current user profile
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: User

// Get users directory
GET /api/users?page=1&limit=12&search=...
Headers: Authorization: Bearer <token> (optional)
Response: { users: User[], pagination: {...} }
```

## Token Management

### Storage

- **localStorage**: `token` and `user` objects
- **API Service**: Automatic token injection in headers
- **Auth Provider**: Centralized token state management

### Security

- **Bearer token** in Authorization header
- **Automatic cleanup** on logout
- **Error handling** for invalid tokens

## Usage Examples

### Login

```typescript
const { login } = useAuth();
const success = await login(email, password);
if (success) {
  // Redirect to dashboard
  router.push("/");
}
```

### Register

```typescript
const { register } = useAuth();
const success = await register(name, email, password);
if (success) {
  // User is automatically logged in
  router.push("/");
}
```

### Check Authentication

```typescript
const { user, isLoading } = useAuth();
if (isLoading) return <Loading />;
if (!user) return <LoginPrompt />;
return <Dashboard />;
```

## Demo Accounts

For testing purposes, you can use these accounts:

- **User**: `anshsardhara@gmail.com` (any password)
- **Admin**: `admin@gmail.com` (any password)

## Error Handling

The system handles various error scenarios:

- **Invalid credentials**: Shows specific error message
- **Network errors**: Generic error with retry option
- **Validation errors**: Form-level validation with helpful messages
- **Server errors**: Graceful degradation with user feedback

## Next Steps

1. **Password reset** functionality
2. **Email verification** flow
3. **Social login** integration
4. **Session refresh** mechanism
5. **Profile management** API integration
