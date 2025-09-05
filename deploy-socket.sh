#!/bin/bash

# Deploy Socket.IO Server to Vercel

echo "🚀 Deploying Socket.IO Server to Vercel..."

# Create a temporary directory for the Socket.IO server
mkdir -p socket-deploy
cd socket-deploy

# Copy Socket.IO server files
cp ../socket-server.js .
cp ../socket-package.json package.json
cp ../vercel-socket.json vercel.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
npx vercel --prod

echo "✅ Socket.IO Server deployed successfully!"
echo "🔗 Update your frontend to use the deployed Socket.IO server URL"
