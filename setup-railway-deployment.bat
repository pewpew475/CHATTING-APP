@echo off
echo 🚀 Setting up Railway deployment for Socket.IO server...

REM Create backend directory
echo 📁 Creating backend directory...
if not exist backend mkdir backend
cd backend

REM Copy Socket.IO server files
echo 📋 Copying Socket.IO server files...
copy ..\socket-server.js .
copy ..\socket-package.json package.json

REM Create README for the backend
echo 📝 Creating README...
(
echo # Chat Socket.IO Server
echo.
echo This is the Socket.IO server for the chat application.
echo.
echo ## Features
echo - Real-time messaging
echo - Online status tracking
echo - Typing indicators
echo - Message read receipts
echo - Chat room management
echo.
echo ## Deployment
echo This server is deployed on Railway and handles all real-time communication for the chat app.
echo.
echo ## Environment Variables
echo - `NODE_ENV`: production
echo - `PORT`: 4000 ^(default^)
echo.
echo ## Health Check
echo - Health endpoint: `/health`
echo - Online users: `/api/online-users`
) > README.md

REM Initialize git repository
echo 🔧 Initializing git repository...
git init
git add .
git commit -m "Initial Socket.IO server deployment"

echo ✅ Backend setup complete!
echo.
echo 📋 Next steps:
echo 1. Install Railway CLI: npm install -g @railway/cli
echo 2. Login to Railway: railway login
echo 3. Deploy: railway deploy
echo 4. Get the Railway URL and update your frontend
echo.
echo 🔗 The backend folder is ready for Railway deployment!
pause
