# CHIO - Railway Deployment Guide

Complete guide for deploying CHIO to Railway with MySQL database.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Deploy Backend to Railway](#deploy-backend-to-railway)
4. [Deploy Frontend to Railway](#deploy-frontend-to-railway)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Post-Deployment Testing](#post-deployment-testing)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance & Monitoring](#maintenance--monitoring)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Railway account (sign up at https://railway.app/)
- ✅ GitHub account
- ✅ Your project code pushed to a GitHub repository
- ✅ Project working locally (tested with `npm run dev`)

---

## Repository Setup

### 1. Create GitHub Repository

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

### 2. Project Structure

Ensure your repository has this structure:

```
your-repo/
├── backend/
│   ├── src/
│   ├── migrations/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── READ.MD
└── DESIGN.md
```

---

## Deploy Backend to Railway

### Step 1: Create New Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub
4. Select your `chio` repository

### Step 2: Add MySQL Database

1. In your Railway project, click "**+ New**"
2. Select "**Database**"
3. Choose "**MySQL**"
4. Railway will create a MySQL database and generate connection details

### Step 3: Configure Backend Service

1. Click "**+ New**" again
2. Select "**GitHub Repo**"
3. Choose your repository
4. Railway will detect it's a monorepo

**Configure the service:**

1. Click on the new service
2. Go to "**Settings**"
3. Under "**Build**":
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

### Step 4: Set Environment Variables

1. In the backend service, go to "**Variables**" tab
2. Click "**Raw Editor**"
3. Add the following variables:

```env
DATABASE_URL=${{MySQL.DATABASE_URL}}
JWT_SECRET=<generate-a-long-random-secret-key>
JWT_EXPIRES_IN=7d
PORT=4000
NODE_ENV=production
```

**Important Notes:**
- `${{MySQL.DATABASE_URL}}` automatically references your MySQL database
- Generate JWT_SECRET using: `openssl rand -base64 64` (or any long random string)
- Railway automatically provides PORT, but we set it explicitly for clarity

### Step 5: Deploy Backend

1. Click "**Deploy**"
2. Railway will build and deploy your backend
3. Watch the deployment logs for any errors
4. Once deployed, Railway provides a public URL

**Get your backend URL:**
- Go to "**Settings**" → "**Networking**"
- Click "**Generate Domain**"
- Note the URL (e.g., `backend-production-xxxx.up.railway.app`)

---

## Deploy Frontend to Railway

### Step 1: Create Frontend Service

1. In the same Railway project, click "**+ New**"
2. Select "**GitHub Repo**"
3. Choose your repository again
4. This creates a second service for the frontend

### Step 2: Configure Frontend Service

1. Click on the frontend service
2. Go to "**Settings**"
3. Under "**Build**":
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** (leave empty, Railway auto-detects Vite)

**Or use this start command for production:**
```
npx serve -s dist -l 3000
```

Then add `serve` to frontend dependencies:
```bash
cd frontend
npm install --save-dev serve
```

### Step 3: Set Environment Variables

1. Go to "**Variables**" tab
2. Click "**Raw Editor**"
3. Add:

```env
VITE_API_BASE_URL=https://your-backend-url.railway.app/api
```

**Replace** `your-backend-url` with your actual backend URL from Step 5 above.

### Step 4: Deploy Frontend

1. Click "**Deploy**"
2. Wait for build to complete
3. Once deployed, generate a domain:
   - Go to "**Settings**" → "**Networking**"
   - Click "**Generate Domain**"

---

## Environment Variables Reference

### Backend Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | MySQL connection string | `${{MySQL.DATABASE_URL}}` | ✅ Yes |
| `JWT_SECRET` | Secret key for JWT signing | `your-random-64-char-string` | ✅ Yes |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` | No (default: 1d) |
| `PORT` | Server port | `4000` | No (Railway auto-assigns) |
| `NODE_ENV` | Environment | `production` | Recommended |

### Frontend Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API URL | `https://backend.railway.app/api` | ✅ Yes |

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

## Post-Deployment Testing

### 1. Test Backend Health

```bash
curl https://your-backend-url.railway.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-30T..."
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

1. Open your frontend URL
2. Try registering a new account
3. Create a task
4. Mark task as complete
5. Check statistics page

### 4. Test CORS

Open browser console on frontend and check for CORS errors. If you see any:

1. Go to backend `src/app.ts`
2. Update CORS configuration:

```typescript
app.use(cors({
  origin: 'https://your-frontend-url.railway.app',
  credentials: true
}));
```

---

## Troubleshooting

### Backend Won't Start

**Issue:** Deployment fails or backend crashes

**Solutions:**

1. **Check Logs:**
   - Go to backend service → Deployments → Click deployment
   - Look for error messages

2. **Common Issues:**
   ```
   Error: Missing required environment variable
   ```
   → Verify all required env vars are set

   ```
   Error: Can't reach database server
   ```
   → Check DATABASE_URL is correct
   → Ensure MySQL service is running
   → Verify MySQL service is linked

3. **Database Connection:**
   - Ensure `DATABASE_URL` uses Railway's MySQL reference: `${{MySQL.DATABASE_URL}}`
   - Check MySQL service is in same project
   - Verify MySQL is not crashed

### Frontend Shows 404 on API Calls

**Issue:** Frontend can't connect to backend

**Solutions:**

1. **Verify API URL:**
   - Check `VITE_API_BASE_URL` is set correctly
   - Include `/api` at the end
   - Use `https://` not `http://`

2. **Check CORS:**
   - Open browser dev tools → Console
   - Look for CORS errors
   - Update backend CORS settings if needed

3. **Rebuild Frontend:**
   - Vite builds environment variables at build time
   - After changing `VITE_API_BASE_URL`, you must **redeploy**
   - Click "**Redeploy**" in Railway

### Database Migration Errors

**Issue:** Migrations fail to apply

**Solutions:**

1. **Check Migration Files:**
   - Ensure all `.sql` files are in `backend/migrations/`
   - Verify SQL syntax is valid for MySQL

2. **Manual Migration:**
   - Go to MySQL service in Railway
   - Click "**Data**" tab
   - Run migrations manually if needed

3. **Reset Database (⚠️ Data Loss):**
   ```bash
   # In Railway MySQL data tab, run:
   DROP DATABASE IF EXISTS railway;
   CREATE DATABASE railway;
   ```
   Then redeploy backend

### Environment Variable Not Working

**Issue:** Env var changes don't take effect

**Solutions:**

1. **Redeploy:**
   - Environment variables require a redeploy
   - Don't just save them - click "**Redeploy**"

2. **Check Syntax:**
   - No quotes needed in Railway
   - Use `${{ServiceName.VARIABLE}}` for references

3. **Frontend Variables:**
   - Must start with `VITE_`
   - Require full rebuild
   - Not accessible at runtime (build-time only)

### Port Already in Use

**Issue:** Build fails with port error

**Solution:**
- Railway automatically assigns PORT
- Remove `PORT` from environment variables
- Or ensure your code uses `process.env.PORT` first:

```typescript
const port = process.env.PORT || 4000;
```

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
mysqldump -u user -p -h host database > backup.sql
```

### Scaling

**Horizontal Scaling:**
- Railway Pro plan supports multiple instances
- Go to service → Settings → Scale

**Vertical Scaling:**
- Upgrade Railway plan for more resources
- Railway automatically scales resources

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

## Security Best Practices

### 1. Environment Variables

✅ **DO:**
- Use Railway's secret management
- Generate strong JWT secrets (64+ characters)
- Use different secrets for production vs development

❌ **DON'T:**
- Commit `.env` files to git
- Share secrets in plain text
- Use weak/common secrets

### 2. Database

✅ **DO:**
- Use Railway's managed MySQL (auto-secured)
- Enable backups
- Use strong passwords

❌ **DON'T:**
- Expose database publicly
- Use default passwords
- Disable SSL connections

### 3. API Security

✅ **DO:**
- Use HTTPS (Railway provides by default)
- Implement rate limiting (add `express-rate-limit`)
- Validate all inputs
- Use helmet.js for security headers

### 4. CORS

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

---

## Cost Optimization

**Railway Pricing:**
- Hobby Plan: $5/month + usage
- Usage-based billing for resources

**Tips to Reduce Costs:**
1. Remove unused services
2. Optimize database queries
3. Use appropriate instance sizes
4. Monitor resource usage regularly

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

## Need Help?

**Railway Documentation:**
- https://docs.railway.app/

**Railway Discord:**
- https://discord.gg/railway

**Project Issues:**
- Open an issue in your GitHub repository

---

## Quick Reference Checklist

**Backend Deployment:**
- [ ] Repository pushed to GitHub
- [ ] Railway project created
- [ ] MySQL database added
- [ ] Backend service configured
- [ ] Environment variables set (DATABASE_URL, JWT_SECRET)
- [ ] Domain generated
- [ ] Health check passes

**Frontend Deployment:**
- [ ] Frontend service created
- [ ] Root directory set to `frontend`
- [ ] VITE_API_BASE_URL configured
- [ ] Domain generated
- [ ] Can register/login successfully

**Post-Deployment:**
- [ ] All features tested
- [ ] No console errors
- [ ] Database working
- [ ] Backups enabled
- [ ] Monitoring set up

