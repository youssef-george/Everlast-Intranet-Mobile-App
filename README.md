# Everlast Intranet

Internal communication and collaboration platform for Everlast employees.

## 🚀 Features

- **Real-time Chat**: Individual and group messaging with typing indicators
- **Employee Directory**: Search and view employee profiles
- **Departments**: Organize employees by departments
- **Groups**: Create and manage team groups
- **Notifications**: Real-time notifications for messages and updates
- **File Sharing**: Upload and share files in conversations
- **Mobile App**: Native Android app built with React Native
- **Dark Mode**: Theme support for better user experience

## 🛠️ Tech Stack

### Backend
- **NestJS** framework
- **Prisma** ORM with SQLite
- **Socket.IO** for WebSocket connections
- **Multer** for file uploads
- **TypeScript** for type safety

### Mobile (React Native)
- **React Native** for Android
- **React Navigation** for navigation
- **React Query** for data fetching
- **Socket.IO Client** for real-time communication
- **AsyncStorage** for local storage

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)
- For Mobile App: Android Studio and Android SDK (for Android development)

## 🚀 Quick Start

### Using Batch Files (Windows)

1. **Start Backend:**
   ```bash
   # Double-click start-backend.bat
   # Or run: cd backend && npm run start:dev
   ```

2. **Start Mobile App:**
   ```bash
   cd mobile
   npm install
   npm run android
   ```

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

#### Mobile App Setup (Android)

```bash
cd mobile
npm install
# For Android emulator
npm run android
# Or use Android Studio to build and run
```

**Note**: Make sure the backend server is running before starting the mobile app. The mobile app connects to `http://10.0.2.2:3001/api` (Android emulator) or your computer's IP address (physical device).

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
├── mobile/               # React Native mobile app
│   ├── android/          # Android native code
│   ├── src/
│   │   ├── screens/      # Screen components
│   │   ├── components/   # React Native components
│   │   ├── navigation/   # Navigation setup
│   │   ├── context/      # React contexts
│   │   ├── services/     # API services
│   │   └── types/        # TypeScript types
│   └── App.tsx           # Main app component
├── start-backend.bat     # Backend startup script
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

### Mobile App Commands

```bash
npm run android        # Run on Android emulator/device
npm run start          # Start Metro bundler
npm run lint           # Run ESLint
```

## 📝 Environment Variables

### Backend
Create `.env` in `backend/`:
```
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
```


## 🗄️ Database

The application uses SQLite (via Prisma). The database file is located at:
```
backend/prisma/dev.db
```

**Note**: The database has been migrated from PostgreSQL to SQLite for local development. All database operations now use SQLite.

## 🔐 Authentication

Currently uses mock authentication. Replace with your authentication system in production.

## 📱 Mobile App

- Native Android app built with React Native
- Real-time communication via Socket.IO
- Offline support with AsyncStorage
- Push notifications (configure in production)

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
