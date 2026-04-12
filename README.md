# Kanban — Full Stack Project Manager

A full-stack project management app with real-time Kanban boards.

## Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Zustand, Socket.io client, @hello-pangea/dnd
- **Backend**: Node.js, Express, Mongoose, Socket.io, JWT auth
- **Database**: MongoDB

## Project Structure
```
kanban/
├── server/               # Express backend
│   ├── models/           # Mongoose models (User, Project, Task)
│   ├── routes/           # REST API routes
│   ├── middleware/        # JWT auth middleware
│   ├── sockets/          # Socket.io handlers
│   ├── index.js          # Entry point
│   └── .env.example      # Environment variables template
└── client/               # React frontend
    └── src/
        ├── api/          # Axios instance with interceptors
        ├── store/        # Zustand stores (auth, projects)
        ├── hooks/        # useSocket hook
        ├── pages/        # Login, Register, Dashboard, Board
        └── components/   # Layout, Board, TaskCard, TaskModal
```

## Quick Start (Local)

### 1. Start MongoDB
Make sure MongoDB is running locally on port 27017, or use:
```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

### 2. Backend
```bash
cd server
cp .env.example .env        # Edit secrets
npm install
npm run dev                 # Runs on http://localhost:5000
```

### 3. Frontend
```bash
cd client
npm install
npm run dev                 # Runs on http://localhost:5173
```

## Quick Start (Docker)
```bash
# From root of project
docker-compose up --build
```
Then open http://localhost:5173

## Features
- JWT authentication (access + refresh tokens)
- Create / manage multiple projects
- Kanban board with drag & drop columns and tasks
- Real-time sync via Socket.io (multi-user)
- Task details: priority, assignee, due date, labels, comments
- Invite team members by email
- Add / rename / delete columns

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh token |
| GET  | /api/auth/me | Get current user |

### Projects
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/projects | List all projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| POST | /api/projects/:id/columns | Add column |
| PUT | /api/projects/:id/columns/:colId | Update column |
| DELETE | /api/projects/:id/columns/:colId | Delete column |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tasks/project/:id | Get tasks for project |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| POST | /api/tasks/:id/move | Move task (drag & drop) |
| POST | /api/tasks/:id/comments | Add comment |
| DELETE | /api/tasks/:id | Delete task |

### Members
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/members/:projectId/invite | Invite member |
| PUT | /api/members/:projectId/members/:userId | Update role |
| DELETE | /api/members/:projectId/members/:userId | Remove member |
