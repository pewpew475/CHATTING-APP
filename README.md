# 💬 Fellowz Chat App

A modern, real-time chat application built with Next.js, Supabase, and TypeScript. Features include user authentication, profile management, real-time messaging, file sharing, and a beautiful responsive UI.

![Fellowz Chat App](https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-2.57.0-green?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🔐 Authentication & User Management
- **Google OAuth** - Quick sign-in with Google
- **Email/Password** - Traditional authentication
- **Profile Management** - Complete user profiles with avatars
- **Profile Completion** - Guided setup for new users
- **Username System** - Unique usernames with availability checking

### 💬 Real-time Messaging
- **Instant Messaging** - Real-time chat with Socket.IO
- **Message Types** - Text, images, and file sharing
- **Typing Indicators** - See when others are typing
- **Message Status** - Read receipts and delivery status
- **Message History** - Persistent chat history

### 👥 Social Features
- **Friend System** - Add and manage friends
- **Friend Requests** - Send and receive friend requests
- **User Search** - Find users by name or username
- **Online Status** - See who's online
- **Profile Discovery** - Browse user profiles

### 🎨 Modern UI/UX
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Mode** - Theme switching support
- **Beautiful Animations** - Smooth transitions and micro-interactions
- **Accessible** - WCAG compliant design
- **Mobile-First** - Optimized for mobile devices

### 🛡️ Security & Privacy
- **Row Level Security** - Database-level security with Supabase
- **Secure File Uploads** - Safe image and file handling
- **Privacy Controls** - Manage what others can see
- **Data Protection** - GDPR compliant data handling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/fellowz-chat-app.git
cd fellowz-chat-app
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Copy the environment template and fill in your values:
```bash
cp env.template .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL from `supabase-schema.sql`
4. Run the quick fix from `QUICK_DATABASE_FIX.sql`

### 5. Start Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
fellowz-chat-app/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── profile/           # Profile pages
│   │   └── setup-profile/     # Profile setup
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── chat/              # Chat-related components
│   │   ├── friends/           # Friend system components
│   │   ├── profile/           # Profile components
│   │   └── ui/                # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── supabase-schema.sql        # Database schema
├── vercel.json               # Vercel deployment config
└── README.md                 # This file
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.2** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icons
- **Framer Motion** - Animations

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - File storage
- **Socket.IO** - Real-time communication
- **Next.js API Routes** - Serverless functions

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Nodemon** - Development server

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side) | ❌ |

### Supabase Setup

1. **Create a new Supabase project**
2. **Enable Google OAuth** (optional)
3. **Create storage bucket** for file uploads
4. **Run the database schema** from `supabase-schema.sql`
5. **Configure Row Level Security** policies

## 📱 Features in Detail

### Authentication Flow
1. User visits the app
2. If not authenticated, redirected to sign-in
3. After authentication, profile completion check
4. If profile incomplete, redirected to setup
5. If complete, access to main chat interface

### Profile Management
- **Complete Profile Setup** - Guided onboarding
- **Profile Editing** - Update information anytime
- **Avatar Upload** - Profile picture management
- **Privacy Settings** - Control visibility
- **Profile Completion** - Progress tracking

### Real-time Chat
- **Instant Messaging** - Messages appear instantly
- **File Sharing** - Images and files
- **Typing Indicators** - Real-time feedback
- **Message History** - Persistent storage
- **Online Status** - See who's available

### Friend System
- **User Search** - Find friends by name/username
- **Friend Requests** - Send and manage requests
- **Friend List** - Manage connections
- **Profile Discovery** - Browse user profiles

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on every push

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables for Production

Set these in your Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/signin` - Sign in with email/password
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signout` - Sign out

### Profile Endpoints
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `POST /api/upload` - Upload profile image

### Chat Endpoints
- `GET /api/chat/:id` - Get chat messages
- `POST /api/chat/:id/message` - Send message
- `GET /api/friends` - Get friends list
- `POST /api/friends/request` - Send friend request

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - Component primitives
- [Lucide](https://lucide.dev/) - Beautiful icons

## 📞 Support

If you have any questions or need help:

1. **Check the documentation** in this README
2. **Look at the issues** on GitHub
3. **Create a new issue** if you don't find an answer
4. **Join our community** (if available)

## 🔄 Changelog

### v1.0.0 (Current)
- ✅ User authentication (Google OAuth + Email/Password)
- ✅ Profile management system
- ✅ Real-time messaging
- ✅ Friend system
- ✅ File sharing
- ✅ Responsive design
- ✅ Mobile optimization

### Upcoming Features
- 🔄 Group chats
- 🔄 Message reactions
- 🔄 Voice messages
- 🔄 Video calls
- 🔄 Message encryption
- 🔄 Push notifications

---

**Made with ❤️ by the Fellowz team**

*Happy chatting! 💬*