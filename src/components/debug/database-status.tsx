'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react'

interface DatabaseStatus {
  connected: boolean
  tablesExist: {
    user_profiles: boolean
    messages: boolean
  }
  errors: string[]
  suggestions: string[]
}

export function DatabaseStatusDebug() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  const checkDatabaseStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-db')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to check database status:', error)
      setStatus({
        connected: false,
        tablesExist: { user_profiles: false, messages: false },
        errors: ['Failed to connect to database test API'],
        suggestions: ['Check your internet connection and try again']
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-check on mount if in development
    if (process.env.NODE_ENV === 'development') {
      checkDatabaseStatus()
    }
  }, [])

  if (!showDebug && process.env.NODE_ENV !== 'development') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Database className="w-4 h-4 mr-2" />
        DB Status
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <Database className="w-4 h-4 mr-2" />
            Database Status
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={checkDatabaseStatus}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebug(false)}
            >
              ×
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          Debug information for database connectivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Checking database...</p>
          </div>
        ) : status ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Connection:</span>
                <Badge variant={status.connected ? 'default' : 'destructive'}>
                  {status.connected ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertCircle className="w-3 h-3 mr-1" />
                  )}
                  {status.connected ? 'Connected' : 'Failed'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">user_profiles:</span>
                <Badge variant={status.tablesExist.user_profiles ? 'default' : 'secondary'}>
                  {status.tablesExist.user_profiles ? 'Exists' : 'Missing'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">messages:</span>
                <Badge variant={status.tablesExist.messages ? 'default' : 'secondary'}>
                  {status.tablesExist.messages ? 'Exists' : 'Missing'}
                </Badge>
              </div>
            </div>

            {status.errors.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-red-600">Errors:</h4>
                <ul className="text-xs space-y-1">
                  {status.errors.map((error, index) => (
                    <li key={index} className="text-red-600">• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {status.suggestions.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-blue-600">Suggestions:</h4>
                <ul className="text-xs space-y-1">
                  {status.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-blue-600">• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <Button onClick={checkDatabaseStatus} size="sm">
              Check Database Status
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}