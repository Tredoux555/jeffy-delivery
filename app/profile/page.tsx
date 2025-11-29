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
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card shadow="lg" className="p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Driver Profile</h1>

            {/* Status Toggle */}
            <div className="mb-8 p-5 bg-jeffy-yellow-light rounded-xl border-2 border-jeffy-yellow/50 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900 text-lg mb-1">Driver Status</p>
                  <p className="text-sm text-gray-700 font-medium">
                    {isOnline ? 'You are online and available for deliveries' : 'You are offline'}
                  </p>
                </div>
                <button
                  onClick={handleStatusToggle}
                  disabled={updating}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg ${
                    isOnline
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600'
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
              <div className="flex items-center gap-4 p-4 bg-jeffy-yellow-light rounded-xl border border-jeffy-yellow/30 hover:shadow-md transition-all">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <User className="w-5 h-5 text-jeffy-yellow-darker" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">Name</p>
                  <p className="font-bold text-gray-900 text-lg">{driver.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-jeffy-yellow-light rounded-xl border border-jeffy-yellow/30 hover:shadow-md transition-all">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <User className="w-5 h-5 text-jeffy-yellow-darker" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">Email</p>
                  <p className="font-bold text-gray-900 text-lg">{driver.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-jeffy-yellow-light rounded-xl border border-jeffy-yellow/30 hover:shadow-md transition-all">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Phone className="w-5 h-5 text-jeffy-yellow-darker" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">Phone</p>
                  <p className="font-bold text-gray-900 text-lg">{driver.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-jeffy-yellow-light rounded-xl border border-jeffy-yellow/30 hover:shadow-md transition-all">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Car className="w-5 h-5 text-jeffy-yellow-darker" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">Vehicle Type</p>
                  <p className="font-bold text-gray-900 text-lg capitalize">{driver.vehicle_type || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

