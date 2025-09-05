// Database connection and collection existence test utility
import { db } from './firebase-db'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'

export interface DatabaseTestResult {
  connected: boolean
  collectionsExist: {
    user_profiles: boolean
    messages: boolean
  }
  errors: string[]
  suggestions: string[]
}

export async function testDatabaseConnection(): Promise<DatabaseTestResult> {
  const result: DatabaseTestResult = {
    connected: false,
    collectionsExist: {
      user_profiles: false,
      messages: false
    },
    errors: [],
    suggestions: []
  }

  try {
    // Test basic connection by trying to access user_profiles collection
    const userProfilesRef = collection(db, 'user_profiles')
    const userProfilesSnapshot = await getDocs(userProfilesRef)
    
    result.connected = true
    result.collectionsExist.user_profiles = true

    // Test messages collection
    const messagesRef = collection(db, 'messages')
    const messagesSnapshot = await getDocs(messagesRef)
    
    result.collectionsExist.messages = true

  } catch (error) {
    result.errors.push(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    result.suggestions.push('Check your Firebase configuration and internet connection')
    result.suggestions.push('Verify your Firebase project is active and not disabled')
  }

  // Add general suggestions if there are errors
  if (result.errors.length > 0) {
    result.suggestions.push('Check the Firebase configuration in your .env file')
    result.suggestions.push('Verify your Firebase project credentials are correct')
  }

  return result
}

// Quick test function for console debugging
export async function quickDatabaseTest() {
  console.log('🔍 Testing database connection...')
  const result = await testDatabaseConnection()
  
  console.log('📊 Database Test Results:')
  console.log(`Connected: ${result.connected ? '✅' : '❌'}`)
  console.log(`user_profiles collection: ${result.collectionsExist.user_profiles ? '✅' : '❌'}`)
  console.log(`messages collection: ${result.collectionsExist.messages ? '✅' : '❌'}`)
  
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

// Test if a specific collection exists and is accessible
export async function testCollectionAccess(collectionName: string): Promise<{ exists: boolean, accessible: boolean, error?: string }> {
  try {
    const collectionRef = collection(db, collectionName)
    const snapshot = await getDocs(collectionRef)

    return { exists: true, accessible: true }
  } catch (error) {
    return { 
      exists: false, 
      accessible: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}