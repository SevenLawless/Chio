# CHIO - Railway Deployment Guide

Complete guide for deploying CHIO to Railway with MySQL database.

## 🚨 Quick Fix: "Missing DATABASE_URL" Error

**If you're seeing "Missing required environment variable: DATABASE_URL":**

1. Go to your Railway project → Backend service
2. Click "**Variables**" tab
3. Click "**+ New Variable**" → "**Reference Variable**"
4. Select your **MySQL service** (the database service, not "railway")
5. Choose "**DATABASE_URL**" from the dropdown
6. **Verify** it shows a connection string like `mysql://user:pass@host:port/db`
7. Click "**Deployments**" → "**Redeploy**" (or trigger a new deployment)

**Still not working?** See [Step 5: Link MySQL Database](#step-5-link-mysql-database-to-backend-service) below for detailed instructions.

---

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
- ✅ **Node.js 20+** (Railway will use Node 20 automatically via `nixpacks.toml`)

**Note:** 
- This project includes `.nvmrc` files in both `backend/` and `frontend/` directories specifying Node 20
- Both `package.json` files have `engines` fields requiring Node 20+
- Railway will automatically detect Node 20 from `.nvmrc` files
- If Railway still uses Node 18, add environment variable `RAILWAY_NODE_VERSION=20` in Railway settings
- If Railway still can't detect them, you'll need to manually configure the Root Directory in Railway settings

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
   - **Build Command:** `npm install && npm run build` (or leave empty - `railway.json` will handle it)
   - **Start Command:** `npm start` (or leave empty - `railway.json` will handle it)

**Note:** 
- The project includes `backend/.nvmrc` specifying Node 20
- The `backend/package.json` has `engines` field requiring Node >=18.0.0
- Railway will automatically detect Node 20 from `.nvmrc` file
- If Railway still uses Node 18, add environment variable: `RAILWAY_NODE_VERSION=20` in Railway settings (see below)

### Step 4: Set Node.js Version (If Needed)

**If Railway is still using Node 18 instead of Node 20:**

1. In the backend service, go to "**Variables**" tab
2. Click "**+ New Variable**" → "**Raw Variable**"
3. Add:
   - Key: `RAILWAY_NODE_VERSION`
   - Value: `20`
4. Save and redeploy

**Note:** Railway should auto-detect Node 20 from `.nvmrc`, but this environment variable ensures it uses Node 20.

### Step 5: Link MySQL Database to Backend Service

**⚠️ CRITICAL: This must be done correctly or the backend will crash with "Invalid URL" error!**

#### Method 1: Using Railway's Reference Variable (Recommended)

1. In your Railway project, click on the **backend service**
2. Go to "**Variables**" tab
3. Click "**+ New Variable**"
4. Select "**Reference Variable**" (or "**Add from Service**")
5. **Important:** You'll see a dropdown with your services - select your **MySQL service** (not "railway" or any other service)
6. Look for one of these variables (in order of preference):
   - `MYSQL_URL` (if available - this is the full connection string)
   - `DATABASE_URL` (if available)
   - If neither exists, use **Method 2** below to construct it manually

**If MYSQL_URL or DATABASE_URL is available:**
- Select it from the dropdown
- Railway will automatically create: `DATABASE_URL=${{YourMySQLServiceName.MYSQL_URL}}`
- **Verify it worked:** The variable should show a value like: `mysql://user:password@host:port/database`

**If only individual MySQL variables are available (MYSQL_HOST, MYSQL_DATABASE, etc.):**
- Use **Method 2** below to construct the connection string manually

#### Method 2: Construct DATABASE_URL from Individual MySQL Variables

**If Railway only shows individual MySQL variables (MYSQL_HOST, MYSQL_DATABASE, etc.), you need to construct the connection string manually:**

1. In your Railway project, click on your **MySQL service**
2. Go to "**Variables**" tab
3. Note down these variables (or reference them):
   - `MYSQL_HOST` (or `MYSQLHOST`)
   - `MYSQL_PORT` (or `MYSQLPORT`, usually 3306)
   - `MYSQL_DATABASE` (or `MYSQLDATABASE`)
   - `MYSQL_USER` (or `MYSQLUSER`)
   - `MYSQL_PASSWORD` (or `MYSQLPASSWORD`)

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

**Alternative: If variable names are different (MYSQLHOST, MYSQLDATABASE, etc.):**
- Use the exact variable names as they appear in Railway
- Example: `${{MySQL.MYSQLHOST}}` instead of `${{MySQL.MYSQL_HOST}}`

**Then add other variables:**
- `JWT_SECRET` = Generate using: https://generate-secret.vercel.app/64
- `JWT_EXPIRES_IN` = `7d`
- `NODE_ENV` = `production`

**Important Notes:**
- The DATABASE_URL must resolve to a full MySQL connection string starting with `mysql://`
- If you see "Invalid URL" error, the DATABASE_URL is not set correctly
- **DO NOT set PORT** - Railway automatically provides this via `process.env.PORT`
- After setting variables, **redeploy** the service (Railway doesn't auto-restart)

### Step 6: Deploy Backend

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
   - **Build Command:** (leave empty - `nixpacks.toml` will handle it)
   - **Start Command:** (leave empty - `nixpacks.toml` will handle it)

**Note:** 
- The project includes `frontend/.nvmrc` specifying Node 20
- The `frontend/package.json` has `engines` field requiring Node >=20.0.0
- Railway will automatically detect Node 20 from `.nvmrc` file
- If Railway still uses Node 18, add environment variable: `RAILWAY_NODE_VERSION=20` in Railway settings
- The `serve` package is configured to serve the built static files

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
   Error: Missing required environment variable: DATABASE_URL
   ```
   → **Solution:**
     1. Go to backend service → Variables tab
     2. Make sure `DATABASE_URL` is set
     3. If using reference: `${{MySQL.DATABASE_URL}}` - verify MySQL service name matches
     4. If manually set: Check the connection string format is correct
     5. **Redeploy** after adding variables (Railway doesn't auto-restart)

   ```
   TypeError: Invalid URL
   input: 'railway'
   ```
   → **This means DATABASE_URL is not set correctly!**
   → **Solution:**
     1. Go to backend service → Variables tab
     2. Check the `DATABASE_URL` variable value
     3. It should be a full MySQL connection string like: `mysql://user:pass@host:port/db`
     4. If it shows just `railway` or `${{MySQL.DATABASE_URL}}` as plain text, it's not resolved
     5. **Fix it:**
        - Delete the incorrect `DATABASE_URL` variable
        - Click "+ New Variable" → "Reference Variable"
        - Select your **MySQL service** (not "railway")
        - Choose "DATABASE_URL" from the dropdown
        - Verify it shows a proper connection string
     6. **Redeploy** after fixing

   ```
   Error: Can't reach database server
   ```
   → Check DATABASE_URL is correct (should start with `mysql://`)
   → Ensure MySQL service is running
   → Verify MySQL service is linked correctly

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

