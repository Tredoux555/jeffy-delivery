'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { createClient } from '@/lib/supabase'
import { Truck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('driver@jeffy.com')
  const [password, setPassword] = useState('driver123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Invalid email or password')
        setLoading(false)
        return
      }

      // Store driver session
      localStorage.setItem('driver', JSON.stringify(data.driver))

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center px-3 sm:px-4 py-8">
      <Card className="w-full max-w-md animate-scale-in" shadow="lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-jeffy-yellow to-jeffy-yellow-dark rounded-2xl mb-6 shadow-jeffy">
            <Truck className="w-10 h-10 text-gray-900" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Driver Login</h1>
          <p className="text-base text-gray-600">Sign in to access your deliveries</p>
        </div>

        {/* Test Credentials Info */}
        <div className="mb-6 p-4 bg-jeffy-yellow-light rounded-xl border-2 border-jeffy-yellow/50 shadow-sm">
          <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Test Credentials</p>
          <div className="space-y-1.5">
            <p className="text-sm font-mono text-gray-900">
              <span className="font-semibold">Email:</span> driver@jeffy.com
            </p>
            <p className="text-sm font-mono text-gray-900">
              <span className="font-semibold">Password:</span> driver123
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="driver@jeffy.com"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in shadow-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
            size="lg"
          >
            Sign In
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="text-jeffy-yellow-darker font-semibold hover:underline transition-colors"
            >
              Register here
            </button>
          </p>
        </form>
      </Card>
    </div>
  )
}

