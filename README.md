# Admin Panel - MasterMind AI Agent

This is the admin dashboard for the MasterMind AI Agent project. It provides comprehensive management and analytics capabilities for the platform.

## Features

### Dashboard
- **Analytics Overview**: Key metrics including:
  - Active Users count
  - Total Questions in database
  - Total Videos in library
  - Published Videos count
- **Trend Charts**: Visual representation of metrics over time:
  - Daily Active Users (DAU) trend
  - Questions Asked trend
  - Videos Watched trend
  - Combined metrics overview

### Management Features
- **User Management**: Full CRUD operations for users
  - Create, edit, and delete users
  - Manage user roles and status
  - View user activity and login history
  
- **Video Management**: Complete video content management
  - Add, edit, and delete videos
  - Manage video status (published/draft/archived)
  - Track video views and metadata
  - Organize by categories
  
- **Question Management**: FAQ and content management
  - Create and manage questions and answers
  - Organize by categories and tags
  - Track question popularity (asked count)
  - Archive inactive questions
  
- **Role Management**: User roles and permissions
  - Create custom roles
  - Manage permissions (read/write access)
  - Assign roles to users
  - View role usage statistics

### Data Persistence
- All data is stored locally using Zustand with localStorage persistence
- Data persists across browser sessions
- No backend required for local development

## Getting Started

### Installation

```bash
cd admin-panel
npm install
```

### Development

```bash
npm run dev
```

The admin panel will be available at `http://localhost:8081`

### Build

```bash
npm run build
```

## Project Structure

```
admin-panel/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   └── AdminLayout.tsx   # Main layout with navigation
│   ├── lib/
│   │   ├── mockData.ts      # Mock analytics data
│   │   └── utils.ts         # Utility functions
│   ├── pages/
│   │   ├── Dashboard.tsx         # Analytics dashboard
│   │   ├── UserManagement.tsx    # User CRUD
│   │   ├── VideoManagement.tsx  # Video CRUD
│   │   ├── QuestionManagement.tsx # Question CRUD
│   │   └── RoleManagement.tsx    # Role CRUD
│   ├── store/
│   │   └── adminStore.ts    # Zustand store with persistence
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

## Configuration

This project uses the same configuration as the main project:
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Recharts for data visualization
- Zustand for state management with localStorage persistence

## Navigation

The admin panel includes a sidebar navigation with:
- Dashboard - Analytics and overview
- Users - User management
- Videos - Video content management
- Questions - FAQ and question management
- Roles - Role and permission management

## Data Management

All management operations (Create, Read, Update, Delete) are fully functional with local data storage. The data persists in browser localStorage and will remain available across sessions.

## Notes

- Currently using local storage for data persistence
- Mock analytics data is generated for trend charts
- Real-time statistics are calculated from the local store
- Backend integration can be added by replacing store actions with API calls
