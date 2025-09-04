// API route to test database connection and table existence
import { NextRequest, NextResponse } from 'next/server'
import { testDatabaseConnection } from '@/lib/database-test'

export async function GET(request: NextRequest) {
  try {
    const result = await testDatabaseConnection()
    
    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      connected: false,
      tablesExist: {
        user_profiles: false,
        messages: false
      },
      errors: ['Failed to test database connection'],
      suggestions: ['Check your Supabase configuration and internet connection']
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // This endpoint can be used to run database setup checks
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'check-tables') {
      const result = await testDatabaseConnection()
      return NextResponse.json(result)
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}