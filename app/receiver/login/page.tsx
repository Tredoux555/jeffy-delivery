'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { createClient } from '@/lib/supabase'
import { Phone, User } from 'lucide-react'

export default function ReceiverLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'phone' | 'name'>('phone')

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('receiver_users')
        .select('*')
        .eq('phone', phone.trim())
        .single()

      if (existingUser) {
        // User exists, save to localStorage and redirect
        localStorage.setItem('receiver', JSON.stringify(existingUser))
        router.push('/receiver/dashboard')
      } else {
        // New user, ask for name
        setStep('name')
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()

      const { data: newUser, error } = await supabase
        .from('receiver_users')
        .insert({
          phone: phone.trim(),
          name: name.trim()
        })
        .select()
        .single()

      if (error) throw error

      localStorage.setItem('receiver', JSON.stringify(newUser))
      router.push('/receiver/dashboard')
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Error creating account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="p-3 bg-jeffy-yellow-light rounded-xl w-fit mx-auto mb-4">
            <User className="w-8 h-8 text-jeffy-yellow-darker" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'phone' ? 'Welcome to Jeffy' : 'Complete Your Profile'}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 'phone'
              ? 'Enter your phone number to get started'
              : 'Tell us your name to complete setup'
            }
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <Input
              type="tel"
              placeholder="+27 11 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone className="w-5 h-5" />}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Checking...' : 'Continue'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="w-5 h-5" />}
              required
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('phone')}
                className="flex-1"
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Complete'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

