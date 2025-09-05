#!/bin/bash

# Setup Railway Deployment for Socket.IO Server

echo "🚀 Setting up Railway deployment for Socket.IO server..."

# Create backend directory
echo "📁 Creating backend directory..."
mkdir -p backend
cd backend

# Copy Socket.IO server files
echo "📋 Copying Socket.IO server files..."
cp ../socket-server.js .
cp ../socket-package.json package.json

# Create README for the backend
echo "📝 Creating README..."
cat > README.md << EOF
# Chat Socket.IO Server

This is the Socket.IO server for the chat application.

## Features
- Real-time messaging
- Online status tracking
- Typing indicators
- Message read receipts
- Chat room management

## Deployment
This server is deployed on Railway and handles all real-time communication for the chat app.

## Environment Variables
- \`NODE_ENV\`: production
- \`PORT\`: 4000 (default)

## Health Check
- Health endpoint: \`/health\`
- Online users: \`/api/online-users\`
EOF

# Initialize git repository
echo "🔧 Initializing git repository..."
git init
git add .
git commit -m "Initial Socket.IO server deployment"

echo "✅ Backend setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Install Railway CLI: npm install -g @railway/cli"
echo "2. Login to Railway: railway login"
echo "3. Deploy: railway deploy"
echo "4. Get the Railway URL and update your frontend"
echo ""
echo "🔗 The backend folder is ready for Railway deployment!"
