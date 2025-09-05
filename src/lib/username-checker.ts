// Username availability checker
import { db } from './firebase-db'
import { collection, query, where, getDocs } from 'firebase/firestore'

export interface UsernameCheckResult {
  available: boolean
  error?: string
}

// Check if username is available in the database
export async function checkUsernameAvailability(username: string): Promise<UsernameCheckResult> {
  try {
    if (!username || username.length < 3) {
      return { available: false, error: 'Username must be at least 3 characters long' }
    }

    // Validate username format
    if (!/^[a-z0-9]+$/.test(username)) {
      return { available: false, error: 'Username can only contain lowercase letters and numbers' }
    }

    // Reserved usernames
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'system', 'api', 'www', 'mail', 'ftp',
      'fellowz', 'support', 'help', 'info', 'contact', 'about', 'terms',
      'privacy', 'security', 'login', 'signup', 'register', 'auth', 'oauth',
      'user', 'users', 'profile', 'profiles', 'account', 'accounts',
      'test', 'testing', 'demo', 'example', 'sample', 'null', 'undefined'
    ]

    if (reservedUsernames.includes(username.toLowerCase())) {
      return { available: false, error: 'This username is reserved' }
    }

    // Check database for existing username using Firebase
    try {
      const q = query(
        collection(db, 'user_profiles'),
        where('username', '==', username.toLowerCase())
      )
      
      const snapshot = await getDocs(q)
      
      // If any documents exist, username is taken
      if (!snapshot.empty) {
        return { available: false, error: 'Username is already taken' }
      }

      return { available: true }
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      // Fall back to mock check if database is not available
      return mockUsernameCheck(username)
    }
  } catch (error) {
    console.error('Error checking username availability:', error)
    return { available: false, error: 'Error checking username availability' }
  }
}

// Mock username check for development/fallback
function mockUsernameCheck(username: string): UsernameCheckResult {
  // Mock existing usernames for testing
  const mockExistingUsernames = [
    'admin', 'test', 'user', 'fellowz', 'demo', 'sample',
    'john', 'jane', 'mike', 'sarah', 'alex', 'chris'
  ]

  if (mockExistingUsernames.includes(username.toLowerCase())) {
    return { available: false, error: 'Username is already taken' }
  }

  return { available: true }
}

// Generate username suggestions based on a base name
export function generateUsernameSuggestions(baseName: string, count: number = 5): string[] {
  const cleanBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15) // Keep it reasonable length

  if (!cleanBase) {
    return ['user123', 'newuser', 'fellowz123', 'chatuser', 'messenger']
  }

  const suggestions: string[] = []
  
  // Add numbers
  for (let i = 1; i <= count; i++) {
    suggestions.push(`${cleanBase}${Math.floor(Math.random() * 1000)}`)
  }

  // Add year
  const currentYear = new Date().getFullYear()
  suggestions.push(`${cleanBase}${currentYear}`)

  // Add random suffixes
  const suffixes = ['chat', 'msg', 'talk', 'connect', 'social']
  suffixes.forEach(suffix => {
    if (suggestions.length < count + 2) {
      suggestions.push(`${cleanBase}${suffix}`)
    }
  })

  return suggestions.slice(0, count)
}