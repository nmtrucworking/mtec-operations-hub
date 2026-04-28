# Environment Configuration for Deployment

This document explains how to configure environment variables for the Frontend application to match the Backend configuration.

## Environment Variables

### VITE_API_BASE_URL
- **Purpose**: Backend API base URL for all API calls
- **Type**: String (URL)
- **Required**: Yes for production
- **Default**: `http://localhost:8000` (development only)
- **Examples**:
  - Development: `http://localhost:8000`
  - Staging: `https://api-staging.example.com`
  - Production: `https://api.example.com`

### VITE_GEMINI_API_KEY
- **Purpose**: Google Gemini AI API key for AI features
- **Type**: String
- **Required**: Only if using AI-powered features
- **How to get**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Security**: Never commit this to version control. Use environment secrets in CI/CD.

## Setup Instructions

### 1. Local Development

Copy the `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update the values in `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GEMINI_API_KEY=your_development_key_here
```

### 2. Staging/Production Deployment

Before deploying, ensure you have:
1. The Backend API URL from ops team
2. Confirmation that backend migrations are complete
3. CORS configured to allow your FE origin on backend

#### Environment Variables to Set:

**On Vercel**:
1. Go to Project Settings → Environment Variables
2. Add the following variables:
   - `VITE_API_BASE_URL`: Your backend API URL
   - `VITE_GEMINI_API_KEY`: Your production Gemini API key (if needed)

Example:
```
VITE_API_BASE_URL=https://api.example.com
VITE_GEMINI_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXX
```

**On Netlify**:
1. Go to Site Settings → Build & Deploy → Environment
2. Add the same variables as Vercel

**On Render** (if using serverless/functions):
1. Go to Environment → Environment Variables
2. Add the same variables

## Backend Environment Requirements

The Backend ops team must configure these environment variables on their deployment:

```
DATABASE_URL=postgres://user:pass@host:5432/dbname
SECRET_KEY=your_jwt_secret_key
CORS_ORIGINS=https://your-frontend-domain.com
ENABLE_SEED_DATA=0              # Set to 0 for production
AUTO_CREATE_TABLES=0            # Use migrations in production
AI_API_KEY=your_ai_key_if_needed
```

### CORS Configuration Example

If your Frontend is deployed at `https://app.example.com`, the backend's `CORS_ORIGINS` should include that exact URL.

## Deployment Checklist

- [ ] Request `API_BASE_URL` from Backend ops
- [ ] Request confirmation that migrations are applied
- [ ] Confirm `CORS_ORIGINS` includes your FE domain
- [ ] Set `VITE_API_BASE_URL` in your hosting platform
- [ ] Set `VITE_GEMINI_API_KEY` in your hosting platform (if using AI)
- [ ] Run health check: `GET ${VITE_API_BASE_URL}/health`
- [ ] Test login with a test account
- [ ] Test at least one protected endpoint with auth token
- [ ] Test AI feature if using it (check latency handling)

## API Integration

The Frontend uses a centralized API client located at `src/services/api.ts`. This client:
- Automatically uses `VITE_API_BASE_URL` for all requests
- Handles authorization headers for authenticated endpoints
- Provides error handling and network failure recovery

### Common API Endpoints Used

```
GET  /health                    # Health check
POST /api/auth/login            # User login
POST /api/auth/refresh          # Refresh token
GET  /api/auth/me               # Get current user
```

All endpoints except `/health` require the `Authorization: Bearer <token>` header.

## Testing Connectivity

### 1. Health Check
```bash
curl ${VITE_API_BASE_URL}/health
# Should return: {"status":"ok"}
```

### 2. Login Test
```bash
curl -X POST ${VITE_API_BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

### 3. Protected Endpoint Test
```bash
curl ${VITE_API_BASE_URL}/api/auth/me \
  -H "Authorization: Bearer ${AUTH_TOKEN}"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Ensure `CORS_ORIGINS` on backend includes your FE domain |
| `API_BASE_URL` not working | Check that URL is accessible and HTTPS in production |
| Login fails | Verify backend auth endpoint is working: `GET /api/auth/me` |
| 404 errors | Confirm backend migrations have been run |

## Security Best Practices

- ✅ Store `SECRET_KEY` and `AI_API_KEY` only on backend (server-side)
- ✅ Use HTTPS for `API_BASE_URL` in production
- ✅ Never commit `.env` files to version control
- ✅ Rotate `SECRET_KEY` and `AI_API_KEY` regularly
- ✅ Use separate keys for dev, staging, and production

## Contact

For Backend environment setup questions, contact the Backend ops team.
For Frontend deployment issues, refer to the repository or create an issue.
