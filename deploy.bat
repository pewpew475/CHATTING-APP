@echo off
echo 🚀 Fellowz Chat App - Vercel Deployment Script
echo ==============================================

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Vercel CLI is not installed. Installing...
    npm install -g vercel
)

REM Check if user is logged in to Vercel
vercel whoami >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 🔐 Please log in to Vercel:
    vercel login
)

REM Check environment variables
echo 🔍 Checking environment variables...

if "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo ⚠️  NEXT_PUBLIC_SUPABASE_URL is not set
    echo Please set your Supabase URL:
    set /p supabase_url="Enter your Supabase URL: "
    set NEXT_PUBLIC_SUPABASE_URL=%supabase_url%
)

if "%NEXT_PUBLIC_SUPABASE_ANON_KEY%"=="" (
    echo ⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY is not set
    echo Please set your Supabase anon key:
    set /p supabase_key="Enter your Supabase anon key: "
    set NEXT_PUBLIC_SUPABASE_ANON_KEY=%supabase_key%
)

REM Build the project
echo 🔨 Building the project...
npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed. Please fix the errors and try again.
    pause
    exit /b 1
)

echo ✅ Build successful!

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod

if %ERRORLEVEL% EQU 0 (
    echo 🎉 Deployment successful!
    echo.
    echo 📋 Post-deployment checklist:
    echo 1. ✅ Set environment variables in Vercel dashboard
    echo 2. ✅ Run database setup in Supabase
    echo 3. ✅ Test user registration/login
    echo 4. ✅ Test profile creation
    echo 5. ✅ Test image uploads
    echo.
    echo 🔗 Your app should be live at the URL provided above!
) else (
    echo ❌ Deployment failed. Please check the errors and try again.
    pause
    exit /b 1
)

pause
