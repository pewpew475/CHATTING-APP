#!/bin/bash

# Deploy Socket.IO Server to Railway

echo "🚀 Deploying Socket.IO Server to Railway..."

# Create deployment directory
mkdir -p railway-deploy
cd railway-deploy

# Copy Socket.IO server files
cp ../socket-server.js .
cp ../socket-package.json package.json

# Initialize git repository
git init
git add .
git commit -m "Initial Socket.IO server deployment"

echo "📦 Installing Railway CLI..."
npm install -g @railway/cli

echo "🔐 Logging into Railway..."
railway login

echo "🚀 Deploying to Railway..."
railway deploy

echo "✅ Socket.IO Server deployed to Railway!"
echo "🔗 Copy the Railway URL and update your frontend configuration"
echo "📝 Update src/hooks/use-socket.ts with the Railway URL"
