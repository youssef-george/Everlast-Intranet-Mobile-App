# How to Start the Backend Server

## Quick Start

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Set up Prisma (if not already done):**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Start the development server:**
   ```bash
   npm run start:dev
   ```

The server will start on `http://localhost:3001`

## Troubleshooting

- **Port 3001 already in use:** Change the PORT in `.env` file or kill the process using port 3001
- **Database connection errors:** Make sure your database is running and configured in `.env`
- **Prisma errors:** Run `npm run prisma:generate` and `npm run prisma:migrate`

## Environment Variables

Create a `.env` file in the backend directory with:
```
DATABASE_URL="your_database_url"
PORT=3001
```
