# 🚀 Railway Deployment Guide

## Quick Start (Recommended)

### **Step 1: Setup Backend Folder**
```bash
# Run the setup script
./setup-railway-deployment.bat

# Or manually:
mkdir backend
cd backend
copy ..\socket-server.js .
copy ..\socket-package.json package.json
git init
git add .
git commit -m "Initial Socket.IO server"
```

### **Step 2: Install Railway CLI**
```bash
npm install -g @railway/cli
```

### **Step 3: Login to Railway**
```bash
railway login
```

### **Step 4: Deploy**
```bash
# From the backend folder
cd backend
railway deploy
```

### **Step 5: Get Railway URL**
- Railway will provide a URL like: `https://your-app.railway.app`
- Copy this URL

### **Step 6: Update Frontend**
Update `src/hooks/use-socket.ts`:
```typescript
const socketUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.railway.app' // Replace with your Railway URL
  : 'http://localhost:4000'
```

---

## 🎯 Alternative: Deploy from Main Repository

If you want to keep everything in one repository:

### **Option A: Deploy Specific Folder**
```bash
# From your main project directory
railway deploy ./backend
```

### **Option B: Use Railway Dashboard**
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect your GitHub repository
4. Set root directory to `backend`
5. Deploy

---

## 🔧 Configuration

### **Environment Variables (Railway)**
Set these in Railway dashboard:
- `NODE_ENV`: `production`
- `PORT`: `4000` (optional, Railway sets this automatically)

### **Frontend Configuration**
Update your frontend to use the Railway URL:
```typescript
// src/hooks/use-socket.ts
const socketUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-railway-app.railway.app'
  : 'http://localhost:4000'
```

---

## 🧪 Testing

### **Test Railway Deployment**
```bash
# Health check
curl https://your-railway-app.railway.app/health

# Expected response:
{"status":"ok","onlineUsers":0,"totalMessages":0}
```

### **Test Frontend Connection**
1. Open your deployed frontend
2. Check browser console for Socket.IO connection
3. Test real-time messaging
4. Verify online status works

---

## 🚨 Troubleshooting

### **Railway CLI Issues**
```bash
# Update Railway CLI
npm update -g @railway/cli

# Check Railway status
railway status
```

### **Deployment Issues**
```bash
# Check logs
railway logs

# Redeploy
railway deploy --detach
```

### **Connection Issues**
1. Verify Railway URL is correct
2. Check CORS settings in Socket.IO server
3. Ensure WebSocket support is enabled

---

## 📋 Complete Workflow

```bash
# 1. Setup backend
./setup-railway-deployment.bat

# 2. Install Railway CLI
npm install -g @railway/cli

# 3. Login and deploy
railway login
cd backend
railway deploy

# 4. Get URL and update frontend
# 5. Deploy frontend to Vercel
npx vercel --prod
```

---

## 🎉 Benefits

- ✅ **Separate deployments** - Frontend and backend independent
- ✅ **WebSocket support** - Railway handles persistent connections
- ✅ **Easy scaling** - Railway auto-scales your server
- ✅ **Free tier** - Railway offers generous free usage
- ✅ **Simple setup** - One command deployment

---

## 🔗 Architecture

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

This setup gives you the best of both worlds:
- **Vercel**: Fast frontend delivery
- **Railway**: Reliable WebSocket server

