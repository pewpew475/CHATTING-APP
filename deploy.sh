#!/bin/bash

# Fellowz Chat App - Deployment Script
# This script helps you deploy to Vercel with proper configuration

echo "🚀 Fellowz Chat App - Vercel Deployment Script"
echo "=============================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

# Check environment variables
echo "🔍 Checking environment variables..."

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "⚠️  NEXT_PUBLIC_SUPABASE_URL is not set"
    echo "Please set your Supabase URL:"
    read -p "Enter your Supabase URL: " supabase_url
    export NEXT_PUBLIC_SUPABASE_URL="$supabase_url"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
    echo "Please set your Supabase anon key:"
    read -p "Enter your Supabase anon key: " supabase_key
    export NEXT_PUBLIC_SUPABASE_ANON_KEY="$supabase_key"
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "1. ✅ Set environment variables in Vercel dashboard"
    echo "2. ✅ Run database setup in Supabase"
    echo "3. ✅ Test user registration/login"
    echo "4. ✅ Test profile creation"
    echo "5. ✅ Test image uploads"
    echo ""
    echo "🔗 Your app should be live at the URL provided above!"
else
    echo "❌ Deployment failed. Please check the errors and try again."
    exit 1
fi
