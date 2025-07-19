"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
import { TaagerApiConfig } from '@/lib/types/admin'
import { AdminAuthService } from '@/lib/services/admin-auth'

interface TaagerApiCredentialsFormProps {
  onCredentialsUpdated?: () => void
}

export function TaagerApiCredentialsForm({ onCredentialsUpdated }: TaagerApiCredentialsFormProps) {
  const [credentials, setCredentials] = useState<Partial<TaagerApiConfig>>({
    apiKey: '',
    taagerId: null,
    baseUrl: 'https://public.api.taager.com',
    country: 'SAU'
  })
  const [currentCredentials, setCurrentCredentials] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; testedAt?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load current credentials on mount
  useEffect(() => {
    loadCurrentCredentials()
  }, [])

  const loadCurrentCredentials = async () => {
    try {
      setLoading(true)
      const authHeaders = AdminAuthService.getAuthHeaders()
      const response = await fetch('/api/admin/taager-credentials', {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      })
      const result = await response.json()
      
      if (result.success) {
        setCurrentCredentials(result.data)
        setCredentials(prev => ({
          ...prev,
          taagerId: result.data.taagerId,
          baseUrl: result.data.baseUrl,
          country: result.data.country
        }))
      }
    } catch (error) {
      console.error('Failed to load credentials:', error)
      setError('Failed to load current credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof TaagerApiConfig, value: string | number) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }))
    setValidationResult(null)
    setError(null)
    setSuccess(null)
  }

  const validateCredentials = async () => {
    if (!credentials.apiKey || !credentials.taagerId) {
      setError('API Key and Taager ID are required')
      return
    }

    try {
      setValidating(true)
      setError(null)
      
      const authHeaders = AdminAuthService.getAuthHeaders()
      const response = await fetch('/api/admin/taager-credentials/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(credentials)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setValidationResult(result.data)
        if (result.data.isValid) {
          setSuccess('Credentials are valid!')
        } else {
          setError('Invalid credentials. Please check your API key and Taager ID.')
        }
      } else {
        setError(result.error || 'Failed to validate credentials')
      }
    } catch (error) {
      console.error('Validation error:', error)
      setError('Failed to validate credentials')
    } finally {
      setValidating(false)
    }
  }

  const saveCredentials = async () => {
    if (!credentials.apiKey || !credentials.taagerId) {
      setError('API Key and Taager ID are required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      const authHeaders = AdminAuthService.getAuthHeaders()
      const response = await fetch('/api/admin/taager-credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(credentials)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setCurrentCredentials(result.data)
        setSuccess('Credentials saved and validated successfully!')
        setCredentials(prev => ({ ...prev, apiKey: '' })) // Clear API key from form
        onCredentialsUpdated?.()
      } else {
        setError(result.error || 'Failed to save credentials')
      }
    } catch (error) {
      console.error('Save error:', error)
      setError('Failed to save credentials')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Taager API Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading credentials...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Taager API Credentials
          {currentCredentials?.isConfigured && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Configured
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure your Taager API credentials to enable dynamic product loading
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Current Status */}
        {currentCredentials && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Current Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Taager ID:</span>
                <span className="ml-2 font-mono">{currentCredentials.taagerId || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-600">API Key:</span>
                <span className="ml-2">{currentCredentials.hasApiKey ? '••••••••' : 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-600">Country:</span>
                <span className="ml-2">{currentCredentials.country}</span>
              </div>
              <div>
                <span className="text-gray-600">Last Validated:</span>
                <span className="ml-2">
                  {currentCredentials.lastValidated 
                    ? new Date(currentCredentials.lastValidated).toLocaleString()
                    : 'Never'
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              value={credentials.apiKey || ''}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              placeholder="Enter your Taager API key"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Taager ID Input */}
        <div className="space-y-2">
          <Label htmlFor="taagerId">Taager ID</Label>
          <Input
            id="taagerId"
            type="number"
            value={credentials.taagerId || ''}
            onChange={(e) => handleInputChange('taagerId', parseInt(e.target.value) || null)}
            placeholder="Enter your Taager ID"
          />
        </div>

        {/* Base URL Input */}
        <div className="space-y-2">
          <Label htmlFor="baseUrl">Base URL</Label>
          <Input
            id="baseUrl"
            type="url"
            value={credentials.baseUrl || ''}
            onChange={(e) => handleInputChange('baseUrl', e.target.value)}
            placeholder="https://public.api.taager.com"
          />
        </div>

        {/* Country Input */}
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={credentials.country || ''}
            onChange={(e) => handleInputChange('country', e.target.value)}
            placeholder="SAU"
          />
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`p-3 rounded-lg ${validationResult.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={validationResult.isValid ? 'text-green-800' : 'text-red-800'}>
                {validationResult.isValid ? 'Credentials are valid' : 'Credentials are invalid'}
              </span>
            </div>
            {validationResult.testedAt && (
              <p className="text-xs text-gray-600 mt-1">
                Tested at: {new Date(validationResult.testedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={validateCredentials}
            disabled={validating || !credentials.apiKey || !credentials.taagerId}
            variant="outline"
          >
            {validating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Test Credentials
          </Button>
          
          <Button
            onClick={saveCredentials}
            disabled={saving || !credentials.apiKey || !credentials.taagerId}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Credentials
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}