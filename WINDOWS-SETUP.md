# Windows Setup Guide

This guide provides instructions for setting up the Automation Platform on Windows.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Git

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd automation-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client for Windows

The Prisma client needs to be regenerated on Windows to include the correct query engine binary:

```bash
npx prisma generate
```

This will download the Windows-specific query engine binary (`query_engine-windows.dll.node`).

### 4. Initialize the Database

Reset the database and seed with default data:

```bash
npm run db:reset
```

Or on Windows PowerShell:

```bash
npm run db:reset:win
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Default Credentials

After running the database reset, you can login with:

- **Admin Account**:
  - Email: `admin@example.com`
  - Password: `admin123`

- **User Account**:
  - Email: `shinish@example.com`
  - Password: `3Mergency!`

## Troubleshooting

### Prisma Query Engine Error

If you see an error like "Prisma Client could not locate query engine for runtime windows":

1. Delete the `node_modules` folder and `package-lock.json`
2. Run `npm install`
3. Run `npx prisma generate`
4. Restart the development server

### Database Locked Error

If you see "attempt to write a readonly database":

**On Windows:**
1. Stop the development server
2. Delete the `prisma/dev.db` file
3. Run `npm run db:reset:win`
4. Restart the server

**On macOS/Linux:**
1. Stop the development server
2. Fix database file permissions:
   ```bash
   chmod 664 prisma/dev.db
   chmod 775 prisma/
   ```
3. Restart the server

If the issue persists, delete the database and reinitialize:
```bash
rm prisma/dev.db
npm run db:reset
```

### Port Already in Use

If port 3000 is already in use:

1. Stop any other applications using port 3000
2. Or modify the port in your `.env` file:
   ```
   PORT=3001
   ```

## Build for Production

To build the application for production:

```bash
npm run build
npm start
```

## Additional Notes

- The SQLite database file is located at `prisma/dev.db`
- All application logs are written to the console
- AWX integration requires network access to your AWX server

## Support

For issues specific to Windows deployment, please check the GitHub issues or create a new one with the "windows" label.
