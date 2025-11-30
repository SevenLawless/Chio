# TaskFlow Studio - Setup Guide

A modern task management application with daily rituals and one-time missions.

## Prerequisites

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **MySQL Server**
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Remember your root password during installation

3. **MySQL Workbench** (optional but recommended)
   - Download from: https://dev.mysql.com/downloads/workbench/

---

## Quick Start

### 1. Create the Database

Open MySQL Workbench, connect to your MySQL server, and run:

```sql
CREATE DATABASE modern_task_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in a new terminal)
cd frontend
npm install
```

### 3. Configure Environment

**Backend** - Create `backend/.env`:

```env
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/modern_task_app
JWT_SECRET=your-secret-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d
PORT=4000
```

> Replace `YOUR_PASSWORD` with your MySQL root password (leave empty if no password: `mysql://root:@localhost:3306/...`)

**Frontend** - Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Open the App

Navigate to `http://localhost:5173` and create an account!

---

## Project Structure

```
├── backend/              # Node.js/Express API
│   ├── src/              # TypeScript source
│   ├── migrations/       # SQL migration files
│   └── .env              # Backend config (create this)
├── frontend/             # React/Vite app
│   ├── src/              # React components
│   └── .env              # Frontend config (create this)
└── READ.MD               # This file
```

---

## Ports Explained

| Port | Service | Description |
|------|---------|-------------|
| 3306 | MySQL | Database server (used in DATABASE_URL) |
| 4000 | Backend | Express API server |
| 5173 | Frontend | Vite dev server (open in browser) |

---

## Available Scripts

### Backend
- `npm run dev` - Start dev server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm test` - Run tests

### Frontend
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

---

## Troubleshooting

### "Authentication failed" Error
- Verify MySQL credentials in `backend/.env`
- Format: `mysql://username:password@localhost:3306/modern_task_app`

### "Can't reach database server" Error
- Ensure MySQL service is running
- Check port 3306 is not blocked

### "Database does not exist" Error
- Create the database in MySQL Workbench:
  ```sql
  CREATE DATABASE modern_task_app;
  ```

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Vite auto-selects next available port

### Module Not Found
- Run `npm install` in both `backend` and `frontend` folders
- Try deleting `node_modules` and `package-lock.json`, then reinstall

---

## Features

- **Daily Tasks** - Recurring rituals that reset each day
- **One-Time Missions** - Tasks tied to a specific date
- **Task States** - Track progress (Not Started → Completed → Skipped)
- **Statistics** - Visual breakdown of your productivity
- **Authentication** - Secure user accounts with JWT

---

## Tech Stack

**Backend:**
- Node.js + Express
- TypeScript
- MySQL (mysql2)
- JWT Authentication
- Zod Validation

**Frontend:**
- React 18
- TypeScript
- TailwindCSS
- React Query
- React Router
- Zustand (state)

---

## Quick Checklist

- [ ] MySQL installed and running
- [ ] Database `modern_task_app` created
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] `backend/.env` configured
- [ ] `frontend/.env` configured
- [ ] Backend running on port 4000
- [ ] Frontend running on port 5173
- [ ] App accessible at http://localhost:5173
