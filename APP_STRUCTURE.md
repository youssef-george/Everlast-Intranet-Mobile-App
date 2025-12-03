# Everlast Intranet - Complete Application Structure

## 📁 Project Overview

**Type**: Full-Stack Monorepo (Frontend + Backend + Deployment Configs)  
**Architecture**: React Frontend + NestJS Backend + PostgreSQL Database  
**Deployment**: Docker/Nixpacks compatible with Coolify

---

## 🌳 Root Directory Structure

```
Everlast-Intranet/
├── 📁 backend/              # NestJS Backend Application
├── 📁 frontend/             # React Frontend Application
├── 📁 assets/               # Static assets (images, icons)
├── 📄 Dockerfile            # Docker multi-stage build configuration
├── 📄 nixpacks.toml         # Nixpacks deployment configuration
├── 📄 package.json          # Root package.json for monorepo
├── 📄 .dockerignore         # Docker ignore rules
├── 📄 .gitignore            # Git ignore rules
└── 📚 Documentation files   # Various guides and setup instructions
```

---

## 🔧 Backend Structure (`/backend`)

### Main Application Files

```
backend/
├── 📁 src/                    # Source code
│   ├── main.ts               # Application entry point
│   ├── app.module.ts         # Root NestJS module
│   │
│   ├── 📁 common/            # Shared services
│   │   └── prisma.service.ts # Prisma ORM service
│   │
│   └── 📁 modules/           # Feature modules
│       ├── 📁 chat/          # Real-time messaging
│       │   ├── chat.controller.ts    # HTTP endpoints
│       │   ├── chat.gateway.ts       # WebSocket gateway
│       │   ├── chat.service.ts       # Business logic
│       │   └── chat.module.ts        # Module definition
│       │
│       ├── 📁 users/         # User management
│       │   ├── users.controller.ts   # User CRUD endpoints
│       │   ├── users.service.ts      # User business logic
│       │   └── users.module.ts       # User module
│       │
│       ├── 📁 groups/        # Group chat management
│       │   ├── groups.controller.ts  # Group endpoints
│       │   ├── groups.service.ts     # Group logic
│       │   └── groups.module.ts      # Group module
│       │
│       ├── 📁 files/         # File upload handling
│       │   ├── files.controller.ts   # Upload endpoints
│       │   ├── files.service.ts      # File storage logic
│       │   └── files.module.ts       # Files module
│       │
│       ├── 📁 notifications/ # Push notifications
│       │   ├── notifications.controller.ts
│       │   ├── notifications.service.ts
│       │   └── notifications.module.ts
│       │
│       ├── 📁 departments/   # Department management
│       │   ├── departments.controller.ts
│       │   ├── departments.service.ts
│       │   └── departments.module.ts
│       │
│       └── 📁 search/        # Global search
│           ├── search.controller.ts
│           ├── search.service.ts
│           └── search.module.ts
│
├── 📁 prisma/                # Database configuration
│   ├── schema.prisma         # Database schema definition
│   ├── seed.ts               # Database seeding script
│   └── 📁 migrations/        # Database migrations
│       ├── 20251130085811_init/
│       ├── 20251130142404_add_notifications/
│       └── 20251202083755_add_avaya_number/
│
├── 📄 package.json           # Backend dependencies
├── 📄 tsconfig.json          # TypeScript configuration
└── 📁 uploads/               # User uploaded files (runtime)
```

### Backend Key Features

- **Framework**: NestJS 10
- **Language**: TypeScript
- **ORM**: Prisma (PostgreSQL)
- **Real-time**: Socket.IO for WebSocket
- **API Prefix**: `/api`
- **Port**: 3001
- **Authentication**: Session-based (can be extended)

---

## 🎨 Frontend Structure (`/frontend`)

### Main Application Files

```
frontend/
├── 📁 src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component
│   ├── index.css             # Global styles (Tailwind)
│   │
│   ├── 📁 pages/             # Page components
│   │   ├── MembersDirectory.tsx    # Employee directory
│   │   ├── EmployeeProfile.tsx     # User profile page
│   │   ├── Chats.tsx               # Chat list page
│   │   ├── MessagesPage.tsx        # Messages with sidebar
│   │   ├── ChatWindow.tsx          # Individual chat window
│   │   ├── Groups.tsx              # Group chat list
│   │   ├── GroupInfo.tsx           # Group details page
│   │   ├── Departments.tsx         # Department management (admin)
│   │   ├── Notifications.tsx       # Notifications page
│   │   └── Profile.tsx             # Current user profile
│   │
│   ├── 📁 components/        # Reusable components
│   │   ├── Layout.tsx              # Main layout wrapper
│   │   ├── Header.tsx              # Top navigation header
│   │   ├── Sidebar.tsx             # Desktop side navigation
│   │   ├── BottomNav.tsx           # Mobile bottom navigation
│   │   ├── SearchBar.tsx           # Global search component
│   │   ├── MessageBubble.tsx       # Chat message display
│   │   ├── ReactionPicker.tsx      # Emoji reaction picker
│   │   ├── AttachmentPreview.tsx   # File attachment preview
│   │   ├── VoiceRecorder.tsx       # Voice message recorder
│   │   ├── ProfileDropdown.tsx     # User profile dropdown
│   │   ├── LoadingSpinner.tsx      # Loading indicator
│   │   ├── ErrorBoundary.tsx       # Error handling boundary
│   │   ├── AddEmployeeModal.tsx    # Add user modal (admin)
│   │   ├── EditEmployeeModal.tsx   # Edit user modal (admin)
│   │   ├── CreateGroupModal.tsx    # Create group modal
│   │   ├── PWAInstallPrompt.tsx    # PWA install banner
│   │   └── UserSelector.tsx        # User selection component
│   │
│   ├── 📁 context/           # React Context providers
│   │   ├── AuthContext.tsx         # Authentication state
│   │   ├── SocketContext.tsx       # WebSocket connection
│   │   ├── NotificationsContext.tsx # Notification state
│   │   └── ThemeContext.tsx        # Dark/light theme
│   │
│   ├── 📁 services/          # API services
│   │   └── api.ts                  # Axios API client
│   │
│   ├── 📁 types/             # TypeScript types
│   │   └── index.ts                # Shared type definitions
│   │
│   ├── 📁 hooks/             # Custom React hooks
│   │   └── useOfflineSync.ts       # Offline sync hook
│   │
│   ├── 📁 utils/             # Utility functions
│   │   ├── errorHandler.ts         # Error handling utilities
│   │   ├── offlineCache.ts         # PWA offline caching
│   │   └── pushNotifications.ts    # Push notification helpers
│   │
│   └── 📁 assets/            # Static assets
│       └── react.svg               # React logo
│
├── 📁 public/                # Public assets
│   ├── icon.png              # PWA icon
│   ├── apple-touch-icon.png  # iOS icon
│   ├── vite.svg              # Vite logo
│   └── cropped-EWMC-Logo-1.png # Company logo
│
├── 📄 package.json           # Frontend dependencies
├── 📄 tsconfig.json          # TypeScript configuration
├── 📄 vite.config.ts         # Vite build configuration
├── 📄 tailwind.config.js     # Tailwind CSS configuration
├── 📄 postcss.config.js      # PostCSS configuration
└── 📄 index.html             # HTML entry point
```

### Frontend Key Features

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API
- **Routing**: React Router v6
- **Real-time**: Socket.IO Client
- **PWA**: Service Worker + Workbox
- **Port**: 5173 (development)

---

## 🗄️ Database Structure (Prisma Schema)

### Main Models

```prisma
- User              # Employee accounts
- Message           # Chat messages
- Attachment        # File attachments
- Reaction          # Message reactions
- Group             # Group chats
- GroupMember       # Group membership
- Notification      # User notifications
- Department        # Company departments
```

### Relationships

```
User
├── sentMessages (1:many)
├── receivedMessages (1:many)
├── groupMemberships (1:many)
├── reactions (1:many)
├── notifications (1:many)
└── forwardedMessages (1:many)

Group
├── members (many:many via GroupMember)
├── messages (1:many)
└── createdBy (many:1 with User)

Message
├── sender (many:1 with User)
├── receiver (many:1 with User)
├── group (many:1 with Group)
├── attachments (1:many)
├── reactions (1:many)
├── replyTo (self-referencing)
└── forwardedFrom (self-referencing)
```

---

## 🚀 Deployment Configuration

### Docker Setup (`Dockerfile`)

```dockerfile
# Multi-stage build:
# Stage 1: Build Frontend (React + Vite)
# Stage 2: Build Backend (NestJS + TypeScript)
# Stage 3: Production (Node.js Alpine + non-root user)

Final image includes:
- Compiled backend in /app/backend/dist
- Frontend build in /app/backend/public
- Production dependencies only
- Health check endpoint
- Prisma migrations
```

### Nixpacks Setup (`nixpacks.toml`)

```toml
# Configuration phases:
# 1. Setup: Install Node.js 22 + OpenSSL
# 2. Install: Install dependencies + Generate Prisma Client
# 3. Build: Build frontend + backend + Copy to public
# 4. Start: Run migrations + Start server
```

---

## 📚 Documentation Files

```
Root Documentation:
├── 📄 README.md                      # Main project overview
├── 📄 DEPLOYMENT_SUMMARY.md          # Deployment completion summary
├── 📄 COOLIFY_DEPLOYMENT_GUIDE.md    # Complete Coolify guide (500+ lines)
├── 📄 COOLIFY_QUICK_START.md         # Quick deployment checklist
├── 📄 NIXPACKS_DEPLOYMENT.md         # Nixpacks specific guide
├── 📄 DEPLOYMENT.md                  # General deployment info
├── 📄 RUN_LOCALLY.md                 # Local development setup
├── 📄 START_BACKEND.md               # Backend startup guide
├── 📄 README_START_SERVER.md         # Server startup instructions
├── 📄 POSTGRESQL_MIGRATION.md        # Database migration guide
├── 📄 NETWORK_ACCESS_GUIDE.md        # Network access setup
├── 📄 NETWORK_ACCESS.md              # Network configuration
├── 📄 PWA_SETUP.md                   # PWA installation guide
├── 📄 FIX_DESKTOP_ICON.md            # Icon troubleshooting
├── 📄 FIX_EMPLOYEE_CREATION.md       # Employee creation issues
├── 📄 SAFARI_TROUBLESHOOTING.md      # Safari-specific fixes
├── 📄 TROUBLESHOOT_NETWORK.md        # Network troubleshooting
├── 📄 UPDATE_PWA_ICON.md             # PWA icon update guide
├── 📄 CHAT_HEADER_LOCATION.md        # UI documentation
├── 📄 WHERE_ARE_OLD_CHATS.md         # Migration notes
├── 📄 QUICK_FIX.txt                  # Quick fixes
└── 📄 QUICK_NETWORK_ACCESS.txt       # Quick network setup
```

---

## 🛠️ Utility Scripts

### Windows Batch Scripts (`.bat`)

```
Backend Management:
├── START_SERVER.bat          # Main server startup
├── START_ALL.bat             # Start both frontend and backend
├── START_BACKEND.md          # Backend only
├── START_FRONTEND.bat        # Frontend only
├── RESTART_APP.bat           # Restart application
├── CHECK_SERVER.bat          # Check server status
├── RUN_MIGRATION.bat         # Run database migrations
├── create-admin.bat          # Create admin user
├── check-database.bat        # Verify database connection
├── verify-db-connection.bat  # Test database
└── test-apis.bat             # Test API endpoints

Setup & Configuration:
├── setup-postgres.bat        # PostgreSQL setup
├── FINAL-START.bat           # Final startup script
├── create-env-and-start.bat  # Create .env and start

Network & Firewall:
├── allow-firewall-ports.bat  # Configure Windows firewall
├── get-ip-address.bat        # Get local IP
└── get-network-url.bat       # Get network URL

PWA & Icons:
├── copy-pwa-icons.bat        # Copy PWA icons
├── fix-pwa-icon.bat          # Fix PWA icon issues
├── fix-desktop-icon.bat      # Fix desktop icon
├── update-pwa-icon.bat       # Update PWA icon
└── verify-icons.bat          # Verify icon installation

Git Operations:
├── push-to-github.bat        # Push to GitHub
└── start-app.bat             # Start application
```

### PowerShell Scripts (`.ps1`)

```
├── start-backend.ps1         # Start backend server
├── allow-firewall-ports.ps1  # Configure firewall
├── push-to-github.ps1        # Git push script
├── fix-and-start.ps1         # Fix issues and start
├── migrate-to-postgres.ps1   # Database migration
├── run-setup.ps1             # Complete setup
├── start-now.ps1             # Quick start
└── start-server.ps1          # Server startup
```

---

## 🔌 API Endpoints

### User Management (`/api/users`)
```
GET    /api/users              # Get all users
GET    /api/users/:id          # Get user by ID
POST   /api/users              # Create user
PATCH  /api/users/:id          # Update user
DELETE /api/users/:id          # Delete user
PATCH  /api/users/:id/activate # Activate user
PATCH  /api/users/:id/deactivate # Deactivate user
```

### Chat/Messages (`/api/chat`)
```
GET    /api/chat/recent/:userId    # Get recent chats
GET    /api/chat/messages/:id      # Get messages for chat
POST   /api/chat/messages          # Send message
PATCH  /api/chat/messages/:id      # Update message
DELETE /api/chat/messages/:id      # Delete message
POST   /api/chat/messages/:id/react # Add reaction
```

### Groups (`/api/groups`)
```
GET    /api/groups                 # Get all groups
GET    /api/groups/:id             # Get group details
POST   /api/groups                 # Create group
PATCH  /api/groups/:id             # Update group
DELETE /api/groups/:id             # Delete group
POST   /api/groups/:id/members     # Add member
DELETE /api/groups/:id/members/:userId # Remove member
```

### Files (`/api/files`)
```
POST   /api/files/upload           # Upload file
GET    /uploads/:filename          # Get uploaded file
```

### Notifications (`/api/notifications`)
```
GET    /api/notifications          # Get notifications
PATCH  /api/notifications/:id/read # Mark as read
DELETE /api/notifications/:id      # Delete notification
```

### Departments (`/api/departments`)
```
GET    /api/departments            # Get all departments
POST   /api/departments            # Create department (admin)
PATCH  /api/departments/:id        # Update department (admin)
DELETE /api/departments/:id        # Delete department (admin)
```

### Search (`/api/search`)
```
GET    /api/search?q=query         # Global search
```

---

## 🔌 WebSocket Events (Socket.IO)

### Client → Server Events
```
sendMessage          # Send new message
joinRoom             # Join chat room
leaveRoom            # Leave chat room
markChatAsRead       # Mark chat as read
typing               # User is typing
stopTyping           # User stopped typing
```

### Server → Client Events
```
newMessage           # New message received
messageUpdated       # Message was edited
messageDeleted       # Message was deleted
messageSaved         # Message saved to database
typing               # Someone is typing
stopTyping           # Stopped typing
userStatusChanged    # User online/offline status
unreadCountUpdate    # Unread count changed
refreshRecentChats   # Refresh chat list
```

---

## 🎨 Technology Stack Summary

### Backend Technologies
- **Runtime**: Node.js 22
- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **Database**: PostgreSQL
- **ORM**: Prisma 5
- **WebSocket**: Socket.IO 4
- **File Upload**: Multer
- **Validation**: class-validator + class-transformer

### Frontend Technologies
- **Runtime**: Node.js 22
- **Framework**: React 18
- **Language**: TypeScript 5
- **Build Tool**: Vite 7 (Rolldown)
- **Styling**: Tailwind CSS 3
- **State Management**: React Query + Context API
- **Routing**: React Router 6
- **Icons**: React Icons
- **Date Handling**: date-fns
- **HTTP Client**: Axios
- **WebSocket**: Socket.IO Client
- **PWA**: vite-plugin-pwa + Workbox

### DevOps & Deployment
- **Container**: Docker (multi-stage)
- **Alternative**: Nixpacks
- **Platform**: Coolify
- **CI/CD**: GitHub (manual push)
- **Version Control**: Git

---

## 📊 Application Flow

### 1. User Authentication Flow
```
1. User loads app → Frontend checks auth state
2. If not authenticated → Redirect to login/auth
3. If authenticated → Load user data + Connect WebSocket
4. Establish Socket.IO connection for real-time features
```

### 2. Real-time Messaging Flow
```
1. User types message in ChatWindow
2. Frontend sends via Socket.IO (sendMessage event)
3. Backend Gateway receives message
4. Backend Service saves to database (Prisma)
5. Backend emits messageSaved to sender
6. Backend emits newMessage to recipient(s)
7. Frontend updates UI with new message
```

### 3. File Upload Flow
```
1. User selects file in ChatWindow
2. Frontend creates FormData with file + metadata
3. POST to /api/files/upload with multipart/form-data
4. Backend saves file to /uploads directory
5. Backend saves attachment record to database
6. Backend emits newMessage with attachment
7. Frontend displays attachment in chat
```

### 4. Notification Flow
```
1. Event occurs (new message, mention, etc.)
2. Backend creates Notification record
3. Backend emits notification via WebSocket
4. Frontend NotificationsContext updates count
5. User clicks notification → Navigate to source
6. Mark notification as read via API
```

---

## 🔐 Security Features

### Current Implementation
- ✅ CORS enabled for frontend origin
- ✅ Input validation (class-validator)
- ✅ Non-root Docker user (UID 1001)
- ✅ PostgreSQL with SSL support
- ✅ File upload restrictions
- ✅ Environment variables for secrets

### Recommended Additions
- ⚠️ JWT authentication
- ⚠️ Rate limiting
- ⚠️ CSRF protection
- ⚠️ XSS sanitization
- ⚠️ SQL injection prevention (Prisma handles this)
- ⚠️ Password hashing (bcrypt)

---

## 📱 PWA Features

### Service Worker
- Offline caching for static assets
- API request caching (NetworkFirst strategy)
- Image caching (CacheFirst strategy)
- Document caching (CacheFirst strategy)
- Background sync for offline messages

### Manifest
- App name: "Everlast Intranet"
- Theme color: #005d99
- Display: standalone
- Orientation: portrait
- Icons: 192x192, 512x512, 180x180
- Shortcuts: Chats, Groups

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Update environment variables
- [ ] Configure DATABASE_URL
- [ ] Set NODE_ENV=production
- [ ] Set PORT=3001
- [ ] Review CORS_ORIGIN

### Deployment
- [ ] Push latest code to GitHub
- [ ] Force pull in Coolify
- [ ] Verify build pack (Dockerfile or Nixpacks)
- [ ] Create PostgreSQL database
- [ ] Set environment variables
- [ ] Create persistent volume for uploads
- [ ] Deploy application
- [ ] Run database migrations
- [ ] Create admin user

### Post-Deployment
- [ ] Verify application accessible
- [ ] Test frontend loads
- [ ] Test API endpoints
- [ ] Test WebSocket connection
- [ ] Test file uploads
- [ ] Configure custom domain (optional)
- [ ] Enable SSL certificate
- [ ] Set up backups

---

## 📞 Support & Resources

### Documentation
- Full deployment guide: `COOLIFY_DEPLOYMENT_GUIDE.md`
- Quick start: `COOLIFY_QUICK_START.md`
- Nixpacks guide: `NIXPACKS_DEPLOYMENT.md`
- Local setup: `RUN_LOCALLY.md`

### External Resources
- NestJS: https://docs.nestjs.com
- React: https://react.dev
- Prisma: https://www.prisma.io/docs
- Coolify: https://coolify.io/docs
- Tailwind CSS: https://tailwindcss.com/docs

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Total Files**: 100+ files  
**Total Lines of Code**: ~15,000+ lines  
**Status**: ✅ Production Ready
