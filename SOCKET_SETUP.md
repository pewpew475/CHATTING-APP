# Socket.IO Server Setup

This guide explains how to set up and deploy the standalone Socket.IO server for real-time chat functionality.

## 🚀 Quick Start

### 1. Local Development

```bash
# Install dependencies for Socket.IO server
cd socket-deploy
npm install

# Start the Socket.IO server
npm run dev
```

The server will run on `http://localhost:4000`

### 2. Deploy to Vercel

```bash
# Run the deployment script
chmod +x deploy-socket.sh
./deploy-socket.sh
```

Or manually:

```bash
# Create deployment directory
mkdir socket-deploy
cd socket-deploy

# Copy files
cp ../socket-server.js .
cp ../socket-package.json package.json
cp ../vercel-socket.json vercel.json

# Deploy
npx vercel --prod
```

### 3. Update Frontend

After deployment, update the Socket.IO URL in `src/hooks/use-socket.ts`:

```typescript
const socketUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-socket-server.vercel.app' // Replace with your deployed URL
  : 'http://localhost:4000'
```

## 📁 Files Structure

```
├── socket-server.js          # Main Socket.IO server
├── socket-package.json       # Dependencies for Socket.IO server
├── vercel-socket.json        # Vercel config for Socket.IO server
├── deploy-socket.sh          # Deployment script
└── SOCKET_SETUP.md          # This file
```

## 🔧 Features

### Real-time Messaging
- ✅ Instant message delivery
- ✅ Message persistence in memory
- ✅ Chat room management
- ✅ User authentication

### Online Status
- ✅ Real-time online/offline status
- ✅ User presence tracking
- ✅ Automatic cleanup on disconnect

### Additional Features
- ✅ Typing indicators
- ✅ Message read receipts
- ✅ Chat room joining/leaving
- ✅ Health check endpoints

## 🌐 API Endpoints

- `GET /health` - Server health check
- `GET /api/online-users` - Get online users
- `GET /api/chat/:chatId/messages` - Get chat messages

## 🔌 Socket.IO Events

### Client → Server
- `authenticate` - User authentication
- `send_message` - Send a message
- `typing` - Typing indicator
- `mark_read` - Mark message as read
- `join_chat` - Join a chat room
- `leave_chat` - Leave a chat room
- `get_chat_messages` - Get chat messages
- `get_online_users` - Get online users

### Server → Client
- `authenticated` - Authentication success
- `auth_error` - Authentication error
- `new_message` - New message received
- `message_sent` - Message sent confirmation
- `user_typing` - User typing indicator
- `user_status` - User online/offline status
- `chat_messages` - Chat messages response
- `message_read` - Message read confirmation

## 🚨 Important Notes

1. **Vercel Limitations**: Vercel has limitations for WebSocket connections. For production, consider using:
   - Railway
   - Render
   - Heroku
   - DigitalOcean App Platform
   - AWS EC2

2. **Memory Storage**: Messages are stored in memory and will be lost on server restart. For production, consider adding:
   - Redis for message storage
   - Database integration
   - Message persistence

3. **Scaling**: For high-traffic applications, consider:
   - Redis adapter for Socket.IO clustering
   - Load balancing
   - Database message storage

## 🔧 Configuration

### Environment Variables
```bash
PORT=4000                    # Server port
NODE_ENV=production         # Environment
```

### CORS Configuration
The server is configured to allow all origins for development. For production, update the CORS settings in `socket-server.js`.

## 🐛 Troubleshooting

### Connection Issues
1. Check if the Socket.IO server is running
2. Verify the URL in the frontend
3. Check CORS settings
4. Ensure ports are not blocked

### Message Not Sending
1. Check Socket.IO connection status
2. Verify user authentication
3. Check chat room joining
4. Review server logs

### Online Status Not Working
1. Verify user authentication
2. Check Socket.IO connection
3. Review online users tracking
4. Check event handlers

## 📞 Support

If you encounter issues:
1. Check the server logs
2. Verify the Socket.IO connection
3. Test with the health check endpoint
4. Review the browser console for errors
