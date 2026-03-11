# Pluteo - Collaborative Project Management Platform

A full-stack collaborative project management application built with the PluteoJS monorepo framework. Features Kanban boards, multiple project views, real-time collaboration, organization management, task dependency tracking, and a React Native mobile app with offline-first sync.

## Features

### Project Management

- **Multiple Views** - Switch between four views for any project board:
  - **Board View (Kanban)** - Drag-and-drop columns with categories, inline task creation, and real-time sync
  - **List View** - Sortable table with grouping by status, priority, category, or assignee
  - **Calendar View** - Month and week views showing tasks by due date, with an unscheduled tasks sidebar
  - **Timeline View (Gantt)** - Horizontal timeline with task bars based on start/due dates, progress indicators, and today marker
- **Projects & Boards** - Create multiple projects per organization, each with multiple boards
- **Categories** - Customizable columns with color coding and WIP limits
- **Task Management** - Full lifecycle with title, description, priority, status, assignee, start date, due date, labels, and cover images. Modern calendar date pickers for start/due dates with clear buttons
- **Effort Levels** - Assign low/medium/high effort to tasks, shown as color-coded badges on cards and in focus mode
- **Task Contents** - Notion-like content blocks inside tasks: code snippets (with language tags), documentation, links, and notes
- **Task Dependencies** - Define blocking/blocked-by relationships with circular dependency detection
- **Labels** - Color-coded labels for task categorization
- **Comments** - Threaded comments on tasks
- **Activity Log** - Full audit trail of task changes
- **Search & Filtering** - Filter tasks by text, priority, and assignee across all views

### Focus Mode

- **Distraction-Free Working** - Full-screen focus environment with minimal UI
- **Today's Tasks** - Automatically shows only tasks due today and overdue tasks across all projects
- **Pomodoro Timer** - Customizable work/short break/long break durations (default 25/5/15 min), visual ring, session tracking, and audio alerts
- **Progress Tracker** - Real-time completion percentage, stats by priority, effort, and project, session pomodoro count
- **Smart Suggestions** - Enter available minutes and get task recommendations based on effort level (e.g., "You have 20 minutes — do these tasks")
- **Auto Block Notifications** - Toggle to suppress notifications and update the page title with timer status

### Organization & Team

- **Organizations** - Create and manage multiple organizations
- **Member Management** - Invite members via email, assign roles (owner/admin/member)
- **Member Titles** - Custom display titles (e.g., CTO, Lead Developer, Designer) visible to all org members
- **Role-Based Access** - Permission system based on member roles

### User Features

- **Authentication** - Email/password signup and signin powered by Better Auth
- **User Profile** - Editable display name and profile settings
- **Notifications** - Task-related notifications
- **Dark Mode** - Toggle between light and dark themes

### Real-Time Collaboration

- **WebSocket Updates** - Live task creation, updates, moves, and deletions via Socket.io
- **Multi-Client Sync** - Changes reflect instantly across all connected clients

### Mobile App (React Native)

- **No Account Required** - Use the full app without signing up or internet. All data is stored locally on device
- **Offline-First Everything** - Create projects, tasks, edit, delete — all work without network
- **Optional Cloud Sync** - Sign in from the Account tab to sync local data to the server and access from the web
- **Auto Sync** - When signed in and internet returns, all offline changes sync automatically in order
- **Sync Queue** - Visual queue showing pending offline changes with manual sync trigger
- **Network Status** - Live connection indicator and offline banner throughout the app
- **Server Settings** - Configure API URL from the Account tab to connect to any Pluteo server

## Tech Stack

| Layer            | Technologies                                                   |
| ---------------- | -------------------------------------------------------------- |
| **Web Frontend** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Framer Motion |
| **Mobile App**   | React Native 0.79, Expo 53, React Navigation 7                 |
| **Backend**      | Express.js, Socket.io, Better Auth                             |
| **Database**     | PostgreSQL, Drizzle ORM                                        |
| **Offline Sync** | AsyncStorage, NetInfo                                          |
| **Drag & Drop**  | @dnd-kit                                                       |
| **Build System** | Turborepo, pnpm                                                |
| **Language**     | TypeScript 5.9+                                                |
| **Validation**   | Zod                                                            |

## Architecture

```
pluteo/
├── apps/
│   ├── next-web/                 # Next.js frontend (port 4020)
│   │   ├── src/app/
│   │   │   ├── dashboard/        # Main dashboard with sidebar
│   │   │   │   ├── projects/     # Project and board views
│   │   │   │   └── focus/        # Focus Mode with Pomodoro timer
│   │   │   ├── login/            # Authentication page
│   │   │   └── accept-invitation/# Organization invite acceptance
│   │   └── src/services/api/     # API service layer (PluteoJS)
│   ├── react-native-mobile/      # React Native mobile app (Expo)
│   │   ├── App.tsx               # Root with navigation & providers
│   │   └── src/
│   │       ├── screens/          # Login, Projects, Tasks, TaskDetail, Sync
│   │       ├── services/         # API client, offline storage, sync engine
│   │       ├── context/          # Auth & Network providers
│   │       └── components/       # SyncBanner, NetworkBadge
│   └── express-api-server/       # Express API server (port 3020)
│       ├── src/api/routes/v1/    # REST API endpoints
│       ├── src/services/         # Business logic layer
│       └── src/loaders/          # Express & socket.io setup
├── packages/
│   ├── better-auth/              # Authentication configuration
│   ├── database/                 # Drizzle ORM schemas & migrations
│   │   └── src/schema/
│   │       ├── betterAuth/       # User, session, org, member tables
│   │       ├── project/          # Project, board, category tables
│   │       └── todo/             # Task, comment, label, activity tables
│   ├── api-types/                # Shared Zod schemas & types
│   ├── email-templates/          # React Email templates
│   ├── eslint-config/            # Shared ESLint config
│   └── typescript-config/        # Shared TypeScript config
├── tooling/                      # Monorepo utilities
├── turbo.json                    # Turborepo configuration
└── pnpm-workspace.yaml           # pnpm workspace config
```

## Getting Started

### Prerequisites

- Node.js 20.9+
- pnpm 9+
- PostgreSQL 14+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pluteo

# Install dependencies
pnpm install
```

### Database Setup

```bash
# Create a PostgreSQL database
createdb pluteodb

# Configure environment variables
cp apps/express-api-server/.env.example apps/express-api-server/.env.development.local
```

Edit `.env.development.local`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_db_user
DATABASE_USER_PASSWORD=your_db_password
DATABASE_NAME=pluteodb
DATABASE_URL=postgresql://your_db_user:your_db_password@localhost:5432/pluteodb

BETTER_AUTH_SECRET=your-secret-key-at-least-64-characters-long
BETTER_AUTH_BASE_URL=http://localhost:3020
BETTER_AUTH_BASE_PATH=/api/v1/auth
```

Run database migrations:

```bash
pnpm --filter @pluteojs/database db:push
```

### Development

```bash
# Run all apps concurrently
pnpm dev

# Run individual apps
pnpm --filter @pluteojs/next-web dev          # Frontend on port 4020
pnpm --filter @pluteojs/express-api-server dev # API on port 3020
```

### Mobile App

```bash
# Start Expo development server
pnpm --filter @pluteojs/react-native-mobile start

# Run on specific platform
pnpm --filter @pluteojs/react-native-mobile android
pnpm --filter @pluteojs/react-native-mobile ios
```

On the login screen, tap **Server Settings** to set your API server URL (e.g. `http://192.168.1.x:3020` for a local network).

### Build

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @pluteojs/next-web build
pnpm --filter @pluteojs/express-api-server build
```

## API Endpoints

### Health Check

| Method | Endpoint      | Description               |
| ------ | ------------- | ------------------------- |
| GET    | `/status`     | Server status and version |
| GET    | `/api/health` | Health check endpoint     |

### Authentication (`/api/v1/auth/`)

| Method | Endpoint              | Description                 |
| ------ | --------------------- | --------------------------- |
| POST   | `/auth/sign-up/email` | Register a new user         |
| POST   | `/auth/sign-in/email` | Sign in with email/password |
| GET    | `/auth/get-session`   | Get current session         |

### Organizations (`/api/v1/auth/organization/`)

| Method | Endpoint                              | Description               |
| ------ | ------------------------------------- | ------------------------- |
| POST   | `/organization/create`                | Create organization       |
| GET    | `/organization/list`                  | List user's organizations |
| POST   | `/organization/update`                | Update organization       |
| POST   | `/organization/delete`                | Delete organization       |
| POST   | `/organization/set-active`            | Set active organization   |
| POST   | `/organization/invite-member`         | Invite member by email    |
| GET    | `/organization/get-full-organization` | Get org with members      |

### Verification (`/api/v1/verification/`)

| Method | Endpoint                                   | Description                |
| ------ | ------------------------------------------ | -------------------------- |
| POST   | `/verification/request-email-verification` | Request email verification |

### Users (`/api/v1/users/`)

| Method | Endpoint  | Description                  |
| ------ | --------- | ---------------------------- |
| GET    | `/users/` | Get user profile             |
| PATCH  | `/users/` | Update profile (name, image) |

### Members (`/api/v1/members/`)

Requires `x-organization-id` header.

| Method | Endpoint             | Description               |
| ------ | -------------------- | ------------------------- |
| GET    | `/members/`          | List organization members |
| PATCH  | `/members/:id/title` | Set member display title  |

### Projects (`/api/v1/projects/`)

| Method | Endpoint        | Description               |
| ------ | --------------- | ------------------------- |
| GET    | `/projects/`    | List projects             |
| GET    | `/projects/:id` | Get project               |
| POST   | `/projects/`    | Create project            |
| PATCH  | `/projects/:id` | Update project            |
| DELETE | `/projects/:id` | Delete project (cascades) |

### Boards & Categories (`/api/v1/`)

| Method | Endpoint                         | Description               |
| ------ | -------------------------------- | ------------------------- |
| GET    | `/projects/:id/boards/`          | List boards               |
| POST   | `/projects/:id/boards/`          | Create board              |
| GET    | `/boards/:id`                    | Get board with categories |
| PATCH  | `/boards/:id`                    | Update board              |
| DELETE | `/boards/:id`                    | Delete board              |
| GET    | `/boards/:id/categories/`        | List categories           |
| POST   | `/boards/:id/categories/`        | Create category           |
| PATCH  | `/boards/:id/categories/:catId`  | Update category           |
| DELETE | `/boards/:id/categories/:catId`  | Delete category           |
| PATCH  | `/boards/:id/categories/reorder` | Reorder categories        |

### Tasks (`/api/v1/`)

| Method | Endpoint               | Description                   |
| ------ | ---------------------- | ----------------------------- |
| GET    | `/projects/:id/tasks/` | List all tasks in project     |
| POST   | `/projects/:id/tasks/` | Create task                   |
| GET    | `/tasks/:id`           | Get task details              |
| PATCH  | `/tasks/:id`           | Update task fields            |
| PATCH  | `/tasks/:id/move`      | Move task to category         |
| PATCH  | `/tasks/reorder`       | Reorder tasks within category |
| DELETE | `/tasks/:id`           | Delete task                   |

### Comments (`/api/v1/tasks/:id/comments/`)

| Method | Endpoint                         | Description    |
| ------ | -------------------------------- | -------------- |
| GET    | `/tasks/:id/comments/`           | List comments  |
| POST   | `/tasks/:id/comments/`           | Add comment    |
| PATCH  | `/tasks/:id/comments/:commentId` | Edit comment   |
| DELETE | `/tasks/:id/comments/:commentId` | Delete comment |

### Activity (`/api/v1/tasks/:id/activity/`)

| Method | Endpoint               | Description      |
| ------ | ---------------------- | ---------------- |
| GET    | `/tasks/:id/activity/` | Get activity log |

### Dependencies (`/api/v1/tasks/:id/dependencies/`)

| Method | Endpoint                         | Description                                                  |
| ------ | -------------------------------- | ------------------------------------------------------------ |
| GET    | `/tasks/:id/dependencies/`       | Get dependencies (returns `blockedBy` and `blocking` arrays) |
| POST   | `/tasks/:id/dependencies/`       | Add dependency (with circular dependency detection)          |
| DELETE | `/tasks/:id/dependencies/:depId` | Remove dependency                                            |

### Task Contents (`/api/v1/tasks/:id/contents/`)

| Method | Endpoint                         | Description                                       |
| ------ | -------------------------------- | ------------------------------------------------- |
| GET    | `/tasks/:id/contents/`           | List content blocks                               |
| POST   | `/tasks/:id/contents/`           | Add content (type: `code`, `doc`, `link`, `note`) |
| PATCH  | `/tasks/:id/contents/:contentId` | Update content block                              |
| DELETE | `/tasks/:id/contents/:contentId` | Delete content block                              |

### Labels (`/api/v1/`)

| Method | Endpoint                     | Description            |
| ------ | ---------------------------- | ---------------------- |
| GET    | `/projects/:id/labels/`      | List project labels    |
| POST   | `/projects/:id/labels/`      | Create label           |
| POST   | `/tasks/:id/labels/:labelId` | Assign label to task   |
| DELETE | `/tasks/:id/labels/:labelId` | Remove label from task |

### Notifications (`/api/v1/notifications/`)

| Method | Endpoint                      | Description                    |
| ------ | ----------------------------- | ------------------------------ |
| GET    | `/notifications/`             | List notifications             |
| GET    | `/notifications/unread-count` | Get unread notification count  |
| PATCH  | `/notifications/:id/read`     | Mark notification as read      |
| PATCH  | `/notifications/read-all`     | Mark all notifications as read |

## Frontend Routes

| Route                                            | Description                                        |
| ------------------------------------------------ | -------------------------------------------------- |
| `/login`                                         | Sign in / sign up page                             |
| `/dashboard`                                     | Projects overview with sidebar navigation          |
| `/dashboard/focus`                               | Focus Mode with Pomodoro timer and today's tasks   |
| `/dashboard/projects/:projectId`                 | Project page (redirects to first board)            |
| `/dashboard/projects/:projectId/boards/:boardId` | Board page with Board/List/Calendar/Timeline views |
| `/accept-invitation/:invitationId`               | Accept organization invitation                     |
| `/todos`                                         | Simple todos list (legacy)                         |

### Mobile App Screens

| Screen      | Description                                                                             |
| ----------- | --------------------------------------------------------------------------------------- |
| Projects    | Projects list (works offline, no account needed), pull-to-refresh, long-press to delete |
| Tasks       | Task list with status filters, offline creation, priority/effort chips                  |
| Task Detail | Edit title, description, status, priority, effort level (all offline)                   |
| Sync        | View pending offline changes, connection status, manual sync trigger                    |
| Account     | Optional sign in/up for cloud sync, server URL settings                                 |

## Database Schema

### Core Tables

| Table               | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `users`             | User accounts                                           |
| `sessions`          | Auth sessions                                           |
| `accounts`          | Auth credentials                                        |
| `organizations`     | Organizations/workspaces                                |
| `members`           | Org membership with roles and titles                    |
| `invitations`       | Pending member invitations                              |
| `projects`          | Projects within organizations                           |
| `boards`            | Boards within projects                                  |
| `categories`        | Columns within boards                                   |
| `tasks`             | Task items with dates, priority, status                 |
| `task_comments`     | Comments on tasks                                       |
| `task_activities`   | Audit log of task changes                               |
| `task_dependencies` | Blocking/blocked-by relationships                       |
| `labels`            | Project-scoped labels                                   |
| `task_labels`       | Task-label associations                                 |
| `task_contents`     | Code snippets, docs, links, and notes attached to tasks |

### Task Fields

| Field              | Type      | Description                                       |
| ------------------ | --------- | ------------------------------------------------- |
| `title`            | text      | Task name                                         |
| `description`      | text      | Detailed description                              |
| `priority`         | text      | `urgent`, `high`, `medium`, `low`, `none`         |
| `status`           | text      | `open`, `in_progress`, `review`, `done`, `closed` |
| `startAt`          | timestamp | Start date (used in Timeline view)                |
| `dueAt`            | timestamp | Due date (used in Calendar/Timeline views)        |
| `assigneeId`       | uuid      | Assigned team member                              |
| `categoryId`       | uuid      | Board column                                      |
| `sortOrder`        | integer   | Position within column                            |
| `estimatedMinutes` | integer   | Time estimate                                     |
| `effortLevel`      | text      | `low`, `medium`, `high`                           |
| `isArchived`       | boolean   | Archive flag                                      |

## Commands

| Command                                        | Description                        |
| ---------------------------------------------- | ---------------------------------- |
| `pnpm dev`                                     | Start all apps in development mode |
| `pnpm build`                                   | Build all apps and packages        |
| `pnpm lint`                                    | Run ESLint across all packages     |
| `pnpm check-types`                             | Run TypeScript type checking       |
| `pnpm format`                                  | Format code with Prettier          |
| `pnpm clean`                                   | Clean build artifacts              |
| `pnpm --filter @pluteojs/database db:push`     | Push schema to database            |
| `pnpm --filter @pluteojs/database db:generate` | Generate migrations                |
| `pnpm --filter @pluteojs/database db:studio`   | Open Drizzle Studio                |

## WebSocket Events

| Event          | Direction        | Description                   |
| -------------- | ---------------- | ----------------------------- |
| `join:board`   | Client -> Server | Subscribe to board updates    |
| `join:project` | Client -> Server | Subscribe to project updates  |
| `task:created` | Server -> Client | New task created              |
| `task:updated` | Server -> Client | Task properties changed       |
| `task:moved`   | Server -> Client | Task moved between categories |
| `task:deleted` | Server -> Client | Task deleted                  |

## Environment Variables

| Variable                   | Default                 | Description                  |
| -------------------------- | ----------------------- | ---------------------------- |
| `DATABASE_URL`             | -                       | PostgreSQL connection string |
| `BETTER_AUTH_SECRET`       | -                       | Auth secret key (64+ chars)  |
| `BETTER_AUTH_BASE_URL`     | `http://localhost:3020` | API server URL               |
| `BETTER_AUTH_BASE_PATH`    | `/api/v1/auth`          | Auth endpoint prefix         |
| `CORS_ORIGIN`              | `http://localhost:4020` | Allowed frontend origin      |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3020` | API URL for frontend         |

## Learn More

- [Turborepo](https://turborepo.com/docs)
- [Next.js](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Better Auth](https://www.better-auth.com)
- [shadcn/ui](https://ui.shadcn.com)
- [dnd kit](https://dndkit.com)

## License

MIT
