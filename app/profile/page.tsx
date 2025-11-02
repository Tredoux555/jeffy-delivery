'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, User, Phone, Car, ToggleLeft, ToggleRight, Package } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [driver, setDriver] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchDriver()
  }, [])

  const fetchDriver = async () => {
    try {
      const driverData = JSON.parse(localStorage.getItem('driver') || '{}')
      if (!driverData.id) {
        router.push('/login')
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverData.id)
        .single()

      if (error) throw error

      setDriver(data)
      setIsOnline(data.status === 'active')
    } catch (error) {
      console.error('Error fetching driver:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    try {
      setUpdating(true)
      const supabase = createClient()
      const newStatus = isOnline ? 'inactive' : 'active'

      await supabase
        .from('drivers')
        .update({ status: newStatus })
        .eq('id', driver?.id)

      setIsOnline(!isOnline)
      
      // Update local storage
      const driverData = JSON.parse(localStorage.getItem('driver') || '{}')
      driverData.status = newStatus
      localStorage.setItem('driver', JSON.stringify(driverData))
      
      alert(`You are now ${newStatus === 'active' ? 'online' : 'offline'}`)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-[spin_3s_linear_infinite]" />
          </div>
          <p className="text-gray-700">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <Card className="text-center p-8">
          <p className="text-gray-700 mb-4">Driver not found</p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
          className="mb-4 sm:mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Driver Profile</h1>

            {/* Status Toggle */}
            <div className="mb-6 p-4 bg-jeffy-yellow-light rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Driver Status</p>
                  <p className="text-sm text-gray-600">
                    {isOnline ? 'You are online and available for deliveries' : 'You are offline'}
                  </p>
                </div>
                <button
                  onClick={handleStatusToggle}
                  disabled={updating}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isOnline
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-400 text-white hover:bg-gray-500'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <ToggleRight className="w-5 h-5" />
                      Online
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5" />
                      Offline
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Driver Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-jeffy-yellow-light rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{driver.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-jeffy-yellow-light rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{driver.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-jeffy-yellow-light rounded-lg">
                <Phone className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{driver.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-jeffy-yellow-light rounded-lg">
                <Car className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Vehicle Type</p>
                  <p className="font-semibold text-gray-900 capitalize">{driver.vehicle_type || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

