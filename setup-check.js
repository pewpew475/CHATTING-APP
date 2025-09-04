#!/usr/bin/env node

/**
 * Setup Check Script for Fellowz Chat App
 * This script checks if all required environment variables are set
 * and provides helpful setup instructions.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Fellowz Chat App - Setup Check\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('📋 Please copy .env.example to .env:');
  console.log('   cp .env.example .env\n');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

// Required environment variables
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

// Parse environment variables
const envVars = {};
envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

// Check each required variable
let allSet = true;
const missingVars = [];

console.log('🔧 Checking environment variables:\n');

requiredVars.forEach(varName => {
  const value = envVars[varName];
  const isSet = value && value !== 'your_firebase_api_key' && value !== 'your_supabase_url' && value !== 'your_supabase_anon_key' && !value.includes('your_');
  
  if (isSet) {
    console.log(`✅ ${varName}`);
  } else {
    console.log(`❌ ${varName} - Not set or using placeholder value`);
    missingVars.push(varName);
    allSet = false;
  }
});

console.log('\n' + '='.repeat(60) + '\n');

if (allSet) {
  console.log('🎉 All environment variables are configured!');
  console.log('🚀 You can now run: npm run dev');
  console.log('\n📖 If you encounter issues, check the README.md file');
} else {
  console.log('⚠️  Setup incomplete. Missing variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  
  console.log('\n📋 Setup Instructions:');
  console.log('\n🔥 Firebase Setup:');
  console.log('1. Go to https://console.firebase.google.com/');
  console.log('2. Create a new project or select existing');
  console.log('3. Enable Authentication > Google provider');
  console.log('4. Create Firestore database');
  console.log('5. Get config from Project Settings > General > Your apps');
  
  console.log('\n🗄️  Supabase Setup:');
  console.log('1. Go to https://supabase.com/');
  console.log('2. Create a new project');
  console.log('3. Run the SQL schema from supabase-schema.sql');
  console.log('4. Get URL and anon key from Settings > API');
  
  console.log('\n📝 Update your .env file with the actual values');
  console.log('📖 For detailed instructions, see README.md');
}

console.log('\n' + '='.repeat(60));
console.log('💬 Need help? Check the troubleshooting section in README.md');
console.log('🐛 Found a bug? Create an issue on GitHub');
console.log('='.repeat(60) + '\n');