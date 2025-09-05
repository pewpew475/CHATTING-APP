# Deployment Guide for Socket.IO Chat App

## 🚨 Important: Vercel Limitations

Vercel **does not support** long-running WebSocket connections required for Socket.IO servers. The Socket.IO server needs to be deployed separately on a platform that supports persistent connections.

## 🚀 Recommended Deployment Strategy

### Option 1: Railway (Recommended)
Railway is perfect for Socket.IO servers and offers excellent free tier.

#### Deploy Socket.IO Server to Railway:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Socket.IO Server**
   ```bash
   # Create a new directory for Socket.IO server
   mkdir socket-server-deploy
   cd socket-server-deploy
   
   # Copy Socket.IO server files
   cp ../socket-server.js .
   cp ../socket-package.json package.json
   
   # Initialize git
   git init
   git add .
   git commit -m "Initial Socket.IO server"
   
   # Connect to Railway
   npx @railway/cli login
   npx @railway/cli deploy
   ```

3. **Get Railway URL**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Update your frontend with this URL

### Option 2: Render
Render also supports WebSocket connections.

#### Deploy Socket.IO Server to Render:

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Connect your GitHub repository
   - Set build command: `npm install`
   - Set start command: `node socket-server.js`
   - Set environment: `Node`

3. **Deploy**
   - Render will automatically deploy your Socket.IO server
   - Get the URL and update your frontend

### Option 3: Heroku
Heroku supports WebSocket connections.

#### Deploy Socket.IO Server to Heroku:

1. **Install Heroku CLI**
   ```bash
   # Install Heroku CLI
   npm install -g heroku
   ```

2. **Deploy**
   ```bash
   # Create Heroku app
   heroku create your-socket-server-name
   
   # Deploy
   git add .
   git commit -m "Deploy Socket.IO server"
   git push heroku main
   ```

## 🌐 Frontend Deployment (Vercel)

The Next.js frontend can be deployed to Vercel as usual:

1. **Deploy to Vercel**
   ```bash
   npx vercel --prod
   ```

2. **Update Socket.IO URL**
   - Update `src/hooks/use-socket.ts` with your deployed Socket.IO server URL
   - Replace `https://your-socket-server.vercel.app` with your actual URL

## 🔧 Configuration Updates

### Update Frontend Socket.IO URL:

```typescript
// src/hooks/use-socket.ts
const socketUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-socket-server.railway.app' // Replace with your deployed URL
  : 'http://localhost:4000'
```

### Environment Variables:

For production, set these environment variables:

```bash
# Socket.IO Server
NODE_ENV=production
PORT=4000

# Frontend
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
```

## 📋 Complete Deployment Steps

### 1. Deploy Socket.IO Server
```bash
# Choose one platform (Railway recommended)
# Follow the platform-specific instructions above
```

### 2. Deploy Frontend
```bash
# Deploy Next.js app to Vercel
npx vercel --prod
```

### 3. Update Configuration
- Update Socket.IO URL in frontend
- Test the connection
- Verify real-time features work

## 🧪 Testing Deployment

### Test Socket.IO Server:
```bash
# Health check
curl https://your-socket-server.railway.app/health

# Expected response:
{"status":"ok","onlineUsers":0,"totalMessages":0}
```

### Test Frontend:
- Open your deployed Vercel URL
- Check browser console for Socket.IO connection
- Test real-time messaging
- Verify online status works

## 🚨 Troubleshooting

### Socket.IO Connection Issues:
1. Check if Socket.IO server is running
2. Verify the URL in frontend
3. Check CORS settings
4. Ensure WebSocket support on platform

### Vercel Deployment Issues:
1. Remove Socket.IO server from Vercel config
2. Deploy only Next.js frontend
3. Use separate platform for Socket.IO server

### CORS Issues:
1. Update CORS settings in Socket.IO server
2. Add your Vercel domain to allowed origins
3. Test with browser developer tools

## 💡 Alternative: Use Firebase Realtime Database

If you prefer to stay with Vercel, you can use Firebase Realtime Database instead of Socket.IO:

1. **Enable Firebase Realtime Database**
2. **Update frontend to use Firebase Realtime Database**
3. **Deploy everything to Vercel**

This approach avoids the WebSocket limitations but may have quota restrictions.

## 🎯 Recommended Architecture

```
┌─────────────────┐    ┌──────────────────┐
│   Next.js App   │    │  Socket.IO Server│
│   (Vercel)      │◄──►│   (Railway)      │
│                 │    │                  │
│ - Frontend      │    │ - WebSockets     │
│ - API Routes    │    │ - Real-time      │
│ - Static Files  │    │ - Chat Logic     │
└─────────────────┘    └──────────────────┘
```

This architecture provides:
- ✅ Fast frontend delivery (Vercel CDN)
- ✅ Real-time features (Railway WebSockets)
- ✅ Scalable and reliable
- ✅ Cost-effective
