# Everlast Intranet

Internal communication and collaboration platform for Everlast employees.

## 🚀 Features

- **Real-time Chat**: Individual and group messaging with typing indicators
- **Employee Directory**: Search and view employee profiles
- **Departments**: Organize employees by departments
- **Groups**: Create and manage team groups
- **Notifications**: Real-time notifications for messages and updates
- **File Sharing**: Upload and share files in conversations
- **Progressive Web App (PWA)**: Installable app with offline support
- **Dark Mode**: Theme support for better user experience

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Socket.IO Client** for real-time communication
- **Tailwind CSS** for styling
- **VitePWA** for PWA capabilities
- **React Query** for data fetching

### Backend
- **NestJS** framework
- **Prisma** ORM with SQLite (development)
- **Socket.IO** for WebSocket connections
- **Multer** for file uploads
- **TypeScript** for type safety

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

## 🚀 Quick Start

### Using Batch Files (Windows)

1. **Start Backend:**
   ```bash
   # Double-click start-backend.bat
   # Or run: cd backend && npm run start:dev
   ```

2. **Start Frontend:**
   ```bash
   # Double-click start-frontend.bat
   # Or run: cd frontend && npm run dev
   ```

3. **Open Browser:**
   - Navigate to: `http://localhost:5173`

### Manual Setup

#### Backend Setup

```bash
cd backend
npm install
npm run prisma:generate
npx prisma migrate dev
npm run start:dev
```

Backend runs on: `http://localhost:3001`

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 📁 Project Structure

```
Everlast-Intranet/
├── backend/              # NestJS backend
│   ├── src/
│   │   ├── modules/      # Feature modules
│   │   │   ├── chat/     # Chat functionality
│   │   │   ├── users/    # User management
│   │   │   ├── groups/   # Group management
│   │   │   └── ...
│   │   └── main.ts       # Application entry
│   └── prisma/           # Database schema
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React contexts
│   │   ├── services/     # API services
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
├── start-backend.bat     # Backend startup script
├── start-frontend.bat    # Frontend startup script
└── RUN_LOCALLY.md        # Detailed setup guide
```

## 🎨 Brand Colors

- **Primary**: `#005d99` (Everlast Blue)
- **Accent**: `#17a74a` (Everlast Green)

## 🔧 Development

### Backend Commands

```bash
npm run start:dev      # Start development server
npm run build          # Build for production
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate # Run database migrations
npm run prisma:seed    # Seed database
```

### Frontend Commands

```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

## 📝 Environment Variables

### Backend
Create `.env` in `backend/`:
```
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
```

### Frontend
No environment variables required for development.

## 🗄️ Database

The application uses SQLite for development (via Prisma). The database file is located at:
```
backend/prisma/dev.db
```

## 🔐 Authentication

Currently uses mock authentication. Replace with your authentication system in production.

## 📱 PWA Features

- Installable on mobile and desktop
- Offline support with service workers
- Push notifications (configure in production)
- App-like experience

## 🐛 Troubleshooting

See `RUN_LOCALLY.md` for detailed troubleshooting guide.

Common issues:
- **Port already in use**: Change ports in config files
- **Database errors**: Run `npx prisma migrate dev`
- **Module not found**: Run `npm install` in respective folder

## 📄 License

Private - Everlast Internal Use Only

## 👥 Contributors

- Everlast Development Team

---

For detailed setup instructions, see [RUN_LOCALLY.md](./RUN_LOCALLY.md)
