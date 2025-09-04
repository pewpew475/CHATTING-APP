// Database connection and table existence test utility
import { supabase } from './supabase'

export interface DatabaseTestResult {
  connected: boolean
  tablesExist: {
    user_profiles: boolean
    messages: boolean
  }
  errors: string[]
  suggestions: string[]
}

export async function testDatabaseConnection(): Promise<DatabaseTestResult> {
  const result: DatabaseTestResult = {
    connected: false,
    tablesExist: {
      user_profiles: false,
      messages: false
    },
    errors: [],
    suggestions: []
  }

  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true })

    if (connectionError) {
      result.errors.push(`Connection error: ${connectionError.message}`)
      
      if (connectionError.code === 'PGRST205') {
        result.errors.push('user_profiles table does not exist')
        result.suggestions.push('Run the SQL schema from supabase-schema.sql in your Supabase SQL Editor')
      } else if (connectionError.code === 'PGRST301' || connectionError.message?.includes('406')) {
        result.errors.push('Row Level Security (RLS) policy issue or API configuration problem')
        result.suggestions.push('Check your RLS policies in Supabase dashboard')
        result.suggestions.push('Verify your NEXT_PUBLIC_SUPABASE_ANON_KEY is correct')
      }
    } else {
      result.connected = true
      result.tablesExist.user_profiles = true
    }

    // Test messages table
    const { data: messagesTest, error: messagesError } = await supabase
      .from('messages')
      .select('count', { count: 'exact', head: true })

    if (messagesError) {
      if (messagesError.code === 'PGRST205') {
        result.errors.push('messages table does not exist')
      }
    } else {
      result.tablesExist.messages = true
    }

  } catch (error) {
    result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    result.suggestions.push('Check your internet connection and Supabase project status')
  }

  // Add general suggestions if there are errors
  if (result.errors.length > 0) {
    result.suggestions.push('Check the DATABASE_SETUP.md file for detailed setup instructions')
    result.suggestions.push('Verify your Supabase project is active and not paused')
  }

  return result
}

// Quick test function for console debugging
export async function quickDatabaseTest() {
  console.log('🔍 Testing database connection...')
  const result = await testDatabaseConnection()
  
  console.log('📊 Database Test Results:')
  console.log(`Connected: ${result.connected ? '✅' : '❌'}`)
  console.log(`user_profiles table: ${result.tablesExist.user_profiles ? '✅' : '❌'}`)
  console.log(`messages table: ${result.tablesExist.messages ? '✅' : '❌'}`)
  
  if (result.errors.length > 0) {
    console.log('❌ Errors:')
    result.errors.forEach(error => console.log(`  - ${error}`))
  }
  
  if (result.suggestions.length > 0) {
    console.log('💡 Suggestions:')
    result.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`))
  }
  
  return result
}

// Test if a specific table exists and is accessible
export async function testTableAccess(tableName: string): Promise<{ exists: boolean, accessible: boolean, error?: string }> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    if (error) {
      if (error.code === 'PGRST205') {
        return { exists: false, accessible: false, error: 'Table does not exist' }
      } else if (error.code === 'PGRST301') {
        return { exists: true, accessible: false, error: 'RLS policy blocks access' }
      } else {
        return { exists: false, accessible: false, error: error.message }
      }
    }

    return { exists: true, accessible: true }
  } catch (error) {
    return { 
      exists: false, 
      accessible: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}