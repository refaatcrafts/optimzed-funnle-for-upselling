"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Coffee, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AdminAuthService } from '@/lib/services/admin-auth'
import { APP_CONFIG } from '@/lib/constants/app'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState(5)

  useEffect(() => {
    // Check if already authenticated
    if (AdminAuthService.validateSession()) {
      router.push('/admin')
      return
    }

    // Update remaining attempts
    setRemainingAttempts(AdminAuthService.getRemainingAttempts())
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (AdminAuthService.isRateLimited()) {
        setError('Too many failed attempts. Please try again in 15 minutes.')
        setIsLoading(false)
        return
      }

      const isAuthenticated = AdminAuthService.authenticate(username, password)
      
      if (isAuthenticated) {
        router.push('/admin')
      }
    } catch (error: any) {
      const remaining = AdminAuthService.getRemainingAttempts()
      setRemainingAttempts(remaining)
      
      if (error?.code === 'RATE_LIMITED') {
        setError('Too many failed attempts. Please try again in 15 minutes.')
      } else if (error?.code === 'INVALID_CREDENTIALS') {
        if (remaining === 0) {
          setError('Too many failed attempts. Please try again in 15 minutes.')
        } else {
          setError(`Invalid credentials. ${remaining} attempts remaining.`)
        }
      } else if (error?.code === 'MISSING_CREDENTIALS') {
        setError('Please enter both username and password.')
      } else {
        setError('An error occurred during login. Please try again.')
      }
      setPassword('')
    } finally {
      setIsLoading(false)
    }
  }

  const isRateLimited = AdminAuthService.isRateLimited()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Coffee className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">{APP_CONFIG.name}</span>
          </div>
          <CardTitle className="text-xl text-gray-700">Admin Login</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={isLoading || isRateLimited}
                required
                className="focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={isLoading || isRateLimited}
                  required
                  className="focus:ring-orange-500 focus:border-orange-500 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isRateLimited}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isRateLimited && remainingAttempts < 5 && remainingAttempts > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {remainingAttempts} login attempts remaining
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
              disabled={isLoading || isRateLimited}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Demo credentials:</p>
            <p>Username: <code className="bg-gray-100 px-1 rounded">user</code></p>
            <p>Password: <code className="bg-gray-100 px-1 rounded">password</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}