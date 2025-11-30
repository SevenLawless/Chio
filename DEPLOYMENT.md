# CHIO - Railway Deployment Guide

Complete guide for deploying CHIO to Railway with MySQL database, including all common setbacks and troubleshooting.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Create New Railway Project](#create-new-railway-project)
4. [Deploy Backend to Railway](#deploy-backend-to-railway)
5. [Deploy Frontend to Railway](#deploy-frontend-to-railway)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Common Setbacks & Solutions](#common-setbacks--solutions)
8. [Post-Deployment Testing](#post-deployment-testing)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)
11. [Maintenance & Monitoring](#maintenance--monitoring)
12. [Quick Reference Checklist](#quick-reference-checklist)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Railway account (sign up at https://railway.app/)
- ✅ GitHub account
- ✅ Your project code pushed to a GitHub repository
- ✅ Project working locally (tested with `npm run dev`)
- ✅ **Node.js 18+** for backend, **Node.js 20+** for frontend

**Important Notes:**
- Backend requires Node.js >=18.0.0 (see `backend/package.json`)
- Frontend requires Node.js >=20.0.0 (see `frontend/package.json`)
- Railway will auto-detect Node versions from `.nvmrc` files if present
- If Railway uses wrong Node version, add `RAILWAY_NODE_VERSION` environment variable

---

## Repository Setup

### 1. Push Code to GitHub

If not already done:

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/chio.git
git branch -M main
git push -u origin main
```

### 2. Verify Project Structure

Ensure your repository has this structure:

```
your-repo/
├── backend/
│   ├── src/
│   ├── migrations/
│   ├── package.json
│   ├── railway.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── railway.json
│   └── vite.config.ts
└── railway.json
```

---

## Create New Railway Project

1. Go to https://railway.app/new
2. Click "**Deploy from GitHub repo**"
3. Authorize Railway to access your GitHub (if first time)
4. Select your repository
5. Railway will create a new project

**Note:** You'll be creating multiple services in this project:
- MySQL Database service
- Backend service
- Frontend service

---

## Deploy Backend to Railway

### Step 1: Add MySQL Database

1. In your Railway project dashboard, click "**+ New**"
2. Select "**Database**"
3. Choose "**MySQL**"
4. Railway will automatically create a MySQL database and generate connection details
5. **Note the service name** (e.g., "MySQL", "mysql", "Database") - you'll need this later

### Step 2: Create Backend Service

1. In the same Railway project, click "**+ New**" again
2. Select "**GitHub Repo**"
3. Choose your repository again
4. Railway will detect it's a monorepo

### Step 3: Configure Backend Service

1. Click on the newly created service (it may be named after your repo)
2. Go to "**Settings**" tab
3. Under "**Build**" section:
   - **Root Directory:** `backend`
   - **Builder:** Select "**Railpack**" from the dropdown (⚠️ CRITICAL - do not use Docker or Nixpacks)
   - **Build Command:** (leave empty - `railway.json` handles it)
   - **Start Command:** (leave empty - `railway.json` handles it)

**⚠️ IMPORTANT:** 
- If you see "Docker" selected as the Builder, you MUST change it to "Railpack"
- If Build Command or Start Command fields have values (like `cd backend && npm install`), **clear them** - Railway should use `backend/railway.json` when Root Directory is set to `backend`
- Railway may show "The value is set in railway.json" - this is correct, but ensure it's using `backend/railway.json`, not the root one

**Note:** The `backend/railway.json` file already contains:
```json
{
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

But since Root Directory is set to `backend`, Railway will run commands from that directory automatically.

**Important:** Railway uses **Railpack** (not Nixpacks) as the default builder. The `railway.json` files are configured to use Railpack. If you encounter "npm: command not found" errors, see [Setback 3: npm: command not found](#setback-3-npm-command-not-found-or-docker-build-error) below.

### Step 4: Set Node.js Version (If Needed)

**If Railway is using Node 18 instead of Node 20, or if you encounter build errors:**

1. In the backend service, go to "**Variables**" tab
2. Click "**+ New Variable**" → "**Raw Variable**"
3. Add:
   - **Key:** `RAILWAY_NODE_VERSION`
   - **Value:** `20` (or `18` if backend requires 18)
4. Click "**Add**"
5. **Redeploy** the service for changes to take effect

### Step 5: Link MySQL Database to Backend Service

**⚠️ CRITICAL: This is the most common source of errors!**

#### Method 1: Using Railway's Reference Variable (Recommended)

1. In your Railway project, click on the **backend service**
2. Go to "**Variables**" tab
3. Click "**+ New Variable**"
4. Select "**Reference Variable**" (or "**Add from Service**")
5. **Important:** In the service dropdown, select your **MySQL service** (the database service, NOT "railway" or any other service)
6. Look for one of these variables in the dropdown:
   - `MYSQL_URL` (preferred - full connection string)
   - `DATABASE_URL` (if available)
   - If neither exists, use **Method 2** below

**If MYSQL_URL or DATABASE_URL is available:**
- Select it from the dropdown
- Railway will automatically create: `DATABASE_URL=${{YourMySQLServiceName.MYSQL_URL}}`
- **Verify it worked:** The variable should show a resolved value like: `mysql://user:password@host:port/database`
- If it shows the raw reference like `${{MySQL.MYSQL_URL}}`, it may not resolve correctly - try Method 2

#### Method 2: Construct DATABASE_URL from Individual MySQL Variables

**If Railway only shows individual MySQL variables (MYSQL_HOST, MYSQL_DATABASE, etc.):**

1. In your Railway project, click on your **MySQL service**
2. Go to "**Variables**" tab
3. Note down these variable names (they may vary):
   - `MYSQL_HOST` or `MYSQLHOST`
   - `MYSQL_PORT` or `MYSQLPORT` (usually 3306)
   - `MYSQL_DATABASE` or `MYSQLDATABASE`
   - `MYSQL_USER` or `MYSQLUSER`
   - `MYSQL_PASSWORD` or `MYSQLPASSWORD`

4. Go back to your **backend service** → "**Variables**" tab
5. Click "**+ New Variable**" → "**Raw Variable**"
6. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** Construct it using Railway's variable references:
     ```
     mysql://${{YourMySQLServiceName.MYSQL_USER}}:${{YourMySQLServiceName.MYSQL_PASSWORD}}@${{YourMySQLServiceName.MYSQL_HOST}}:${{YourMySQLServiceName.MYSQL_PORT}}/${{YourMySQLServiceName.MYSQL_DATABASE}}
     ```
   - **⚠️ Replace `YourMySQLServiceName`** with your actual MySQL service name (check in Railway dashboard - it's case-sensitive!)

**Example:**
If your MySQL service is named "MySQL", the value would be:
```
mysql://${{MySQL.MYSQL_USER}}:${{MySQL.MYSQL_PASSWORD}}@${{MySQL.MYSQL_HOST}}:${{MySQL.MYSQL_PORT}}/${{MySQL.MYSQL_DATABASE}}
```

**To find your MySQL service name:**
- Look at your Railway project dashboard
- Find the MySQL database service
- The name shown there is what you need (e.g., if it says "MySQL", use `MySQL` in the references above)
- **Case-sensitive!** "MySQL" ≠ "mysql"

**Alternative: If variable names are different (MYSQLHOST, MYSQLDATABASE, etc.):**
- Use the exact variable names as they appear in Railway
- Example: `${{MySQL.MYSQLHOST}}` instead of `${{MySQL.MYSQL_HOST}}`

### Step 6: Add Other Backend Environment Variables

1. Still in backend service → "**Variables**" tab
2. Click "**+ New Variable**" → "**Raw Variable**"
3. Add these variables one by one:

| Variable | Value | Description |
|----------|-------|-------------|
| `JWT_SECRET` | Generate a random 64+ character string | Secret key for JWT token signing |
| `JWT_EXPIRES_IN` | `7d` | Token expiration time (optional, default: 1d) |
| `NODE_ENV` | `production` | Environment mode (recommended) |

**Generate JWT_SECRET:**
```bash
# Option 1: OpenSSL
openssl rand -base64 64

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/64
```

**Important Notes:**
- **DO NOT set PORT** - Railway automatically provides this via `process.env.PORT`
- The DATABASE_URL must resolve to a full MySQL connection string starting with `mysql://`
- After setting variables, you must **redeploy** the service (Railway doesn't auto-restart)

### Step 7: Configure CORS (Security)

**Current Issue:** The backend has `app.use(cors())` which allows all origins. This is insecure for production.

**Before deploying, update CORS in `backend/src/app.ts`:**

1. Edit `backend/src/app.ts`
2. Replace:
   ```typescript
   app.use(cors());
   ```
   With:
   ```typescript
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'https://your-frontend-url.railway.app',
     credentials: true
   }));
   ```
3. Add `FRONTEND_URL` environment variable in Railway (after frontend is deployed)
4. Commit and push changes

**Or for multiple origins:**
```typescript
app.use(cors({
  origin: [
    'https://your-frontend-url.railway.app',
    'http://localhost:5173' // for local development
  ],
  credentials: true
}));
```

### Step 8: Deploy Backend

1. Click "**Deployments**" tab
2. Click "**Deploy**" (or Railway may auto-deploy on push)
3. Watch the deployment logs for any errors
4. Wait for deployment to complete

**Get your backend URL:**
1. Go to "**Settings**" → "**Networking**"
2. Click "**Generate Domain**"
3. Note the URL (e.g., `backend-production-xxxx.up.railway.app`)
4. **Save this URL** - you'll need it for frontend configuration

**Verify deployment:**
- Check logs for: `[database] Connected successfully`
- Check logs for: `[database] Applied migration: 001_initial_schema.sql`
- Check logs for: `Server listening on port XXXX`
- Test health endpoint: `https://your-backend-url.railway.app/health`

---

## Deploy Frontend to Railway

### Step 1: Create Frontend Service

1. In the same Railway project, click "**+ New**"
2. Select "**GitHub Repo**"
3. Choose your repository again
4. This creates a second service for the frontend

### Step 2: Configure Frontend Service

1. Click on the frontend service
2. Go to "**Settings**" tab
3. Under "**Build**" section:
   - **Root Directory:** `frontend`
   - **Builder:** Select "**Railpack**" from the dropdown (⚠️ CRITICAL - do not use Docker or Nixpacks)
   - **Build Command:** (leave empty - `railway.json` handles it)
   - **Start Command:** (leave empty - `railway.json` handles it)

**⚠️ IMPORTANT:** If you see "Docker" selected as the Builder, you MUST change it to "Railpack". Railway may default to Docker, which will cause "npm: command not found" errors.

**Note:** The `frontend/railway.json` file contains:
```json
{
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npx serve -s dist -l $PORT"
  }
}
```

**Important:** Railway uses **Railpack** (not Nixpacks) as the default builder. The `railway.json` files are configured to use Railpack. If you encounter "npm: command not found" errors, see [Setback 3: npm: command not found](#setback-3-npm-command-not-found-or-docker-build-error) below.

### Step 3: Set Node.js Version (If Needed)

**If Railway is using Node 18 instead of Node 20:**

1. In the frontend service, go to "**Variables**" tab
2. Click "**+ New Variable**" → "**Raw Variable**"
3. Add:
   - **Key:** `RAILWAY_NODE_VERSION`
   - **Value:** `20`
4. Click "**Add**"
5. **Redeploy** the service

### Step 4: Set Environment Variables

1. Go to "**Variables**" tab
2. Click "**+ New Variable**" → "**Raw Variable**"
3. Add:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://your-backend-url.railway.app/api` | Backend API URL (replace with your actual backend URL) |

**Important:**
- Replace `your-backend-url` with your actual backend URL from Step 8 above
- Include `/api` at the end
- Use `https://` not `http://`
- **Vite environment variables must start with `VITE_`**
- After changing `VITE_API_BASE_URL`, you **must redeploy** (Vite builds env vars at build time)

### Step 5: Deploy Frontend

1. Click "**Deployments**" tab
2. Click "**Deploy**"
3. Wait for build to complete (this may take a few minutes)
4. Once deployed, generate a domain:
   - Go to "**Settings**" → "**Networking**"
   - Click "**Generate Domain**"
   - Note the URL (e.g., `frontend-production-xxxx.up.railway.app`)

### Step 6: Update Backend CORS with Frontend URL

1. Go back to backend service → "**Variables**" tab
2. Add new variable:
   - **Key:** `FRONTEND_URL`
   - **Value:** `https://your-frontend-url.railway.app` (your actual frontend URL)
3. **Redeploy** backend service

**Or update `backend/src/app.ts` directly:**
```typescript
app.use(cors({
  origin: 'https://your-frontend-url.railway.app',
  credentials: true
}));
```

Then commit and push.

---

## Environment Variables Reference

### Backend Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | MySQL connection string | `${{MySQL.MYSQL_URL}}` or constructed string | ✅ Yes |
| `JWT_SECRET` | Secret key for JWT signing | `your-random-64-char-string` | ✅ Yes |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` | No (default: 1d) |
| `PORT` | Server port | Auto-assigned by Railway | No (Railway auto-assigns) |
| `NODE_ENV` | Environment | `production` | Recommended |
| `FRONTEND_URL` | Frontend URL for CORS | `https://frontend.railway.app` | Recommended |
| `RAILWAY_NODE_VERSION` | Node.js version | `20` | Only if auto-detection fails |

### Frontend Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API URL | `https://backend.railway.app/api` | ✅ Yes |
| `RAILWAY_NODE_VERSION` | Node.js version | `20` | Only if auto-detection fails |

### Generating Secrets

**For JWT_SECRET:**

```bash
# Option 1: OpenSSL
openssl rand -base64 64

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Option 3: Online
# Visit: https://generate-secret.vercel.app/64
```

---

## Common Setbacks & Solutions

### Setback 1: "Missing required environment variable: DATABASE_URL"

**Symptoms:**
- Backend fails to start
- Error in logs: `Missing required environment variable: DATABASE_URL`

**Solution:**
1. Go to backend service → "**Variables**" tab
2. Verify `DATABASE_URL` exists
3. If using reference variable, check:
   - MySQL service name matches exactly (case-sensitive)
   - Variable name is correct (`MYSQL_URL` or `DATABASE_URL`)
4. If manually constructed, verify the syntax:
   - Must start with `mysql://`
   - Format: `mysql://user:pass@host:port/database`
5. **Redeploy** after fixing

### Setback 2: "TypeError: Invalid URL" or "Invalid URL format"

**Symptoms:**
- Error: `TypeError: Invalid URL input: 'railway'` or similar
- Backend crashes on startup

**Root Cause:** DATABASE_URL is not resolving correctly. It's showing the raw reference or wrong value.

**Solution:**
1. Go to backend service → "**Variables**" tab
2. Check the `DATABASE_URL` value
3. If it shows `railway` or `${{MySQL.DATABASE_URL}}` as plain text, it's not resolved
4. **Fix it:**
   - Delete the incorrect `DATABASE_URL` variable
   - Click "+ New Variable" → "Reference Variable"
   - Select your **MySQL service** (not "railway")
   - Choose "DATABASE_URL" or "MYSQL_URL" from dropdown
   - Verify it shows a proper connection string like `mysql://user:pass@host:port/db`
5. **Redeploy** after fixing

### Setback 3: "npm: command not found" or Docker Build Error

**Symptoms:**
- Build fails with: `npm: command not found`
- Error: `Docker build failed` or `failed to solve`
- Railway is trying to use Docker instead of Railpack

**Root Cause:** Railway is defaulting to Docker build instead of Railpack, and Node.js/npm is not available in the Docker image.

**Solution:**

**Option 1: Force Railpack Builder in Railway Dashboard (CRITICAL - Do This First!)**

**⚠️ The most common cause:** Railway dashboard settings override `railway.json`. You MUST change it in the dashboard:

1. Go to your backend service in Railway
2. Click "**Settings**" tab
3. Scroll to "**Build**" section
4. Find the "**Builder**" dropdown
5. **Change it from "Docker" to "Railpack"** (or "Nixpacks" to "Railpack")
6. **Save** the settings
7. Click "**Deployments**" tab → Click "**Redeploy**" button

**Why this happens:** Railway may have auto-detected Docker or you may have selected it during initial setup. The `railway.json` file alone is not enough - you must also set it in the dashboard.

**Verify it worked:**
- After redeploy, check build logs
- You should NOT see "Dockerfile" in the logs
- You should see Railpack detecting Node.js
- Build should proceed with npm commands working

**Option 2: Verify railway.json Configuration**

1. Ensure `backend/railway.json` specifies Railpack:
   ```json
   {
     "build": {
       "builder": "RAILPACK",
       "buildCommand": "npm install && npm run build"
     }
   }
   ```

2. Commit and push the updated `railway.json` file
3. **Still change the Builder in Railway dashboard** (see Option 1 above)

**Option 3: Verify Root Directory**

1. Go to backend service → "**Settings**"
2. Under "**Build**", verify:
   - **Root Directory:** `backend` (must be set correctly)
   - Railway should use `backend/railway.json` when Root Directory is `backend`
3. If Root Directory is not set, set it to `backend`
4. **Redeploy**

**Option 4: Check railway.json Location**

- Ensure `backend/railway.json` exists (not just root `railway.json`)
- The `backend/railway.json` should have `"builder": "RAILPACK"`
- Root `railway.json` is for monorepo setup, but when Root Directory is `backend`, Railway should use `backend/railway.json`

**Option 5: Ensure Node.js Detection**

Railpack should automatically detect Node.js from:
- `package.json` with `engines.node` field (in the Root Directory)
- `.nvmrc` file (in the Root Directory)
- If detection fails, add environment variable:
  - **Key:** `RAILWAY_NODE_VERSION`
  - **Value:** `20` (or `18` if backend requires 18)

**Option 6: Root railway.json Conflict (If Railway Shows "The value is set in railway.json")**

**If Railway is using Railpack but still shows "npm: command not found":**

The issue might be that Railway is using the **root `railway.json`** (which has `cd backend &&`) instead of `backend/railway.json`, even though Root Directory is set to `backend`.

**Quick Fix (Try This First):**

1. Go to backend service → **Settings** → **Build**
2. **Clear the Build Command field** (delete any value like `cd backend && npm install && npm run build`)
3. **Clear the Start Command field** (delete any value like `cd backend && npm start`)
4. Ensure **Root Directory:** `backend` is set
5. Ensure **Builder:** `Railpack` is selected
6. **Save** settings
7. **Redeploy**

This forces Railway to use `backend/railway.json` instead of the root one.

**If Quick Fix Doesn't Work:**

1. **Delete or rename the root `railway.json`** (temporarily):
   ```bash
   # Rename it so Railway doesn't use it
   mv railway.json railway.json.backup
   git add railway.json.backup
   git commit -m "Temporarily disable root railway.json"
   git push
   ```

2. **Verify Root Directory is set:**
   - Go to backend service → Settings → Build
   - Ensure **Root Directory:** `backend` is set
   - Railway should now use `backend/railway.json`

3. **Redeploy**

4. **Alternative:** If you need the root `railway.json` for other services, ensure it doesn't have build commands that conflict. The root one should only be used if Root Directory is NOT set.

**Option 7: Add Node.js Detection Hint**

If Railpack still doesn't detect Node.js, create a `package.json` in the root (minimal) to help detection:

```json
{
  "name": "root",
  "private": true,
  "engines": {
    "node": ">=18.0.0"
  }
}
```

Or ensure `.nvmrc` exists in root with `20` (if you want Node 20).

**Verification:**
- After redeploy, check build logs
- You should see Railpack detecting Node.js
- Build should proceed with npm commands working
- Look for messages like "Detected Node.js" or "Installing Node.js" in build logs
- The build command should NOT include `cd backend &&` if Root Directory is set correctly

### Setback 4: "Can't reach database server" or Connection Timeout

**Symptoms:**
- Database connection fails
- Timeout errors in logs

**Solutions:**
1. Verify MySQL service is running (check Railway dashboard)
2. Check DATABASE_URL format is correct (should start with `mysql://`)
3. Ensure MySQL service is in the same Railway project
4. Verify MySQL service is not crashed (restart if needed)
5. Check if MySQL service has public networking enabled (usually not needed)

### Setback 5: CORS Errors in Browser

**Symptoms:**
- Browser console shows: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`
- API calls fail with CORS errors

**Solution:**
1. Update backend CORS configuration (see Step 7 in Backend Deployment)
2. Add `FRONTEND_URL` environment variable to backend
3. Update `backend/src/app.ts`:
   ```typescript
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'https://your-frontend-url.railway.app',
     credentials: true
   }));
   ```
4. Commit, push, and redeploy backend

### Setback 6: Frontend Shows 404 on API Calls

**Symptoms:**
- Frontend loads but API calls return 404
- Network tab shows failed requests

**Solutions:**
1. **Verify API URL:**
   - Check `VITE_API_BASE_URL` is set correctly
   - Must include `/api` at the end
   - Use `https://` not `http://`
2. **Rebuild Frontend:**
   - Vite builds environment variables at build time
   - After changing `VITE_API_BASE_URL`, you **must redeploy**
   - Click "**Redeploy**" in Railway
3. **Check Backend Routes:**
   - Verify backend is running
   - Test backend health: `https://your-backend-url.railway.app/health`

### Setback 7: Node Version Mismatch

**Symptoms:**
- Build fails with version errors
- "Unsupported engine" warnings

**Solutions:**
1. Add `RAILWAY_NODE_VERSION` environment variable:
   - Backend: `20` (or `18` if that's what backend requires)
   - Frontend: `20`
2. **Redeploy** after adding variable
3. Verify in build logs that correct Node version is used

### Setback 8: Environment Variable Not Working

**Symptoms:**
- Variable is set but code doesn't see it
- Wrong values being used

**Solutions:**
1. **Redeploy:** Environment variables require a redeploy to take effect
2. **Check Syntax:**
   - No quotes needed in Railway
   - Use `${{ServiceName.VARIABLE}}` for references
   - No spaces around `=`
3. **Frontend Variables:**
   - Must start with `VITE_`
   - Require full rebuild (not accessible at runtime)
   - Changes require redeploy

### Setback 9: Database Migration Errors

**Symptoms:**
- Migrations fail to apply
- Database schema errors

**Solutions:**
1. **Check Migration Files:**
   - Ensure all `.sql` files are in `backend/migrations/`
   - Verify SQL syntax is valid for MySQL
2. **Check Logs:**
   - Look for specific migration error messages
   - Verify database connection is working
3. **Manual Migration (if needed):**
   - Go to MySQL service in Railway
   - Click "**Data**" tab
   - Run migrations manually using Railway's SQL editor
4. **Reset Database (⚠️ Data Loss):**
   ```sql
   DROP DATABASE IF EXISTS railway;
   CREATE DATABASE railway;
   ```
   Then redeploy backend

### Setback 10: Port Already in Use

**Symptoms:**
- Build fails with port error
- "EADDRINUSE" error

**Solution:**
- Railway automatically assigns PORT
- Remove `PORT` from environment variables if you added it
- Ensure your code uses `process.env.PORT` first:
  ```typescript
  const port = process.env.PORT || 4000;
  ```

### Setback 11: Build Fails with TypeScript Errors

**Symptoms:**
- Build fails during `npm run build`
- TypeScript compilation errors

**Solutions:**
1. Fix TypeScript errors locally first
2. Run `npm run build` locally to verify
3. Ensure all dependencies are in `package.json`
4. Check `tsconfig.json` is correct

---

## Post-Deployment Testing

### 1. Test Backend Health

```bash
curl https://your-backend-url.railway.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-XXT..."
}
```

### 2. Test Database Connection

Check Railway logs:
1. Go to backend service
2. Click "**Deployments**"
3. Click latest deployment
4. Look for:
   ```
   [database] Connected successfully
   [database] Applied migration: 001_initial_schema.sql
   [database] Applied migration: 002_add_indexes.sql
   [database] All migrations applied successfully
   Server listening on port XXXX
   ```

### 3. Test Frontend

1. Open your frontend URL in browser
2. Try registering a new account
3. Create a task
4. Mark task as complete
5. Check statistics page
6. Open browser console - check for errors

### 4. Test CORS

1. Open browser console on frontend
2. Check for CORS errors
3. If you see CORS errors, update backend CORS configuration (see Setback 4)

### 5. Test API Endpoints

```bash
# Test registration
curl -X POST https://your-backend-url.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# Test login
curl -X POST https://your-backend-url.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

---

## Troubleshooting

### Backend Won't Start

**Checklist:**
1. ✅ All required environment variables are set
2. ✅ DATABASE_URL is correctly formatted and resolved
3. ✅ MySQL service is running
4. ✅ Node version is correct
5. ✅ Check deployment logs for specific error messages

**Common Error Messages:**

**"Missing required environment variable: DATABASE_URL"**
→ See Setback 1

**"Invalid URL" or "TypeError: Invalid URL"**
→ See Setback 2

**"Can't reach database server"**
→ See Setback 3

**"Port already in use"**
→ See Setback 9

### Frontend Won't Build

**Checklist:**
1. ✅ Node version is 20+
2. ✅ All dependencies installed
3. ✅ `VITE_API_BASE_URL` is set correctly
4. ✅ No TypeScript errors
5. ✅ Check build logs for specific errors

### Database Issues

**Checklist:**
1. ✅ MySQL service is running
2. ✅ DATABASE_URL is correct
3. ✅ Migrations ran successfully
4. ✅ Check MySQL service logs

**Reset Database (⚠️ Data Loss):**
1. Go to MySQL service → "**Data**" tab
2. Run:
   ```sql
   DROP DATABASE IF EXISTS railway;
   CREATE DATABASE railway;
   ```
3. Redeploy backend to run migrations

### API Not Responding

**Checklist:**
1. ✅ Backend is deployed and running
2. ✅ Health endpoint works: `/health`
3. ✅ CORS is configured correctly
4. ✅ Frontend URL is correct in `VITE_API_BASE_URL`
5. ✅ Check backend logs for errors

### Authentication Issues

**Checklist:**
1. ✅ `JWT_SECRET` is set and is a long random string
2. ✅ Tokens are being sent in Authorization header
3. ✅ Check browser console for errors
4. ✅ Verify JWT token format in browser dev tools

---

## Security Best Practices

### 1. Environment Variables

✅ **DO:**
- Use Railway's secret management
- Generate strong JWT secrets (64+ characters)
- Use different secrets for production vs development
- Never commit `.env` files

❌ **DON'T:**
- Commit `.env` files to git
- Share secrets in plain text
- Use weak/common secrets
- Hardcode secrets in code

### 2. Database

✅ **DO:**
- Use Railway's managed MySQL (auto-secured)
- Enable backups
- Use strong passwords (Railway generates these)
- Keep database private (don't expose publicly)

❌ **DON'T:**
- Expose database publicly
- Use default passwords
- Disable SSL connections
- Share database credentials

### 3. API Security

✅ **DO:**
- Use HTTPS (Railway provides by default)
- Configure CORS properly (not `origin: '*'`)
- Validate all inputs
- Use helmet.js for security headers (consider adding)
- Implement rate limiting (consider adding `express-rate-limit`)

❌ **DON'T:**
- Allow all CORS origins in production
- Skip input validation
- Expose sensitive data in error messages

### 4. CORS Configuration

✅ **DO:**
```typescript
app.use(cors({
  origin: 'https://your-frontend.railway.app',
  credentials: true
}));
```

❌ **DON'T:**
```typescript
app.use(cors({ origin: '*' })); // Too permissive!
```

### 5. JWT Tokens

✅ **DO:**
- Use strong, random JWT secrets
- Set appropriate expiration times
- Store tokens securely (httpOnly cookies recommended for production)
- Validate tokens on every request

---

## Maintenance & Monitoring

### Viewing Logs

**Backend Logs:**
1. Go to backend service
2. Click "**Deployments**"
3. Click active deployment
4. View real-time logs

**Frontend Logs:**
- Same process as backend

**MySQL Logs:**
1. Go to MySQL service
2. Click "**Logs**" tab

### Database Backup

**Option 1: Railway Backup (Recommended)**
1. Go to MySQL service
2. Click "**Backups**" (if available on your plan)
3. Enable automatic backups

**Option 2: Manual Export**
1. Go to MySQL service
2. Click "**Data**" tab
3. Use Railway's built-in export tool

**Option 3: mysqldump**
```bash
# Get DATABASE_URL from Railway
# Extract connection details and run:
mysqldump -u user -p -h host database > backup.sql
```

### Scaling

**Horizontal Scaling:**
- Railway Pro plan supports multiple instances
- Go to service → Settings → Scale

**Vertical Scaling:**
- Upgrade Railway plan for more resources
- Railway automatically scales resources based on usage

### Monitoring

**Built-in Metrics:**
- Railway provides CPU, Memory, Network usage
- Go to service → **Metrics** tab

**Custom Monitoring:**
- Add logging service (e.g., Logtail, Sentry)
- Monitor application errors
- Track API response times

### Updating the App

**Process:**
1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub
4. Railway auto-deploys on push (if enabled)

**Manual Deploy:**
1. Go to service
2. Click "**Deployments**"
3. Click "**Deploy**" button

**Rollback:**
1. Go to "**Deployments**"
2. Find previous working deployment
3. Click three dots → "**Redeploy**"

---

## Quick Reference Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Project tested locally

### Backend Deployment
- [ ] Railway project created
- [ ] MySQL database added
- [ ] Backend service created
- [ ] Root directory set to `backend`
- [ ] Node version set (if needed)
- [ ] DATABASE_URL configured correctly
- [ ] JWT_SECRET generated and set
- [ ] Other environment variables set
- [ ] CORS configured (not open to all)
- [ ] Domain generated
- [ ] Health check passes
- [ ] Database migrations applied

### Frontend Deployment
- [ ] Frontend service created
- [ ] Root directory set to `frontend`
- [ ] Node version set to 20 (if needed)
- [ ] VITE_API_BASE_URL configured
- [ ] Domain generated
- [ ] Can register/login successfully
- [ ] No console errors

### Post-Deployment
- [ ] All features tested
- [ ] No CORS errors
- [ ] Database working
- [ ] Authentication working
- [ ] Tasks can be created/completed
- [ ] Statistics page works
- [ ] Backups enabled (if available)
- [ ] Monitoring set up

### Security
- [ ] CORS configured properly
- [ ] JWT_SECRET is strong and random
- [ ] No secrets in code
- [ ] HTTPS enabled (Railway default)
- [ ] Database not publicly exposed

---

## Need Help?

**Railway Documentation:**
- https://docs.railway.app/

**Railway Discord:**
- https://discord.gg/railway

**Project Issues:**
- Open an issue in your GitHub repository

---

## Alternative: Frontend on Vercel

If you prefer to deploy frontend on Vercel instead of Railway:

### 1. Deploy to Vercel

```bash
cd frontend
npm install -g vercel
vercel
```

### 2. Set Environment Variable

In Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add: `VITE_API_BASE_URL` = `https://backend.railway.app/api`

### 3. Update Backend CORS

```typescript
app.use(cors({
  origin: ['https://your-app.vercel.app'],
  credentials: true
}));
```

---

**Last Updated:** 2025-01-XX
**Project:** CHIO Task Management App
**Deployment Platform:** Railway

