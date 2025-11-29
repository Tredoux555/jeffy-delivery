'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { createClient } from '@/lib/supabase'
import { DeliveryNotification } from '@/types/database'
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Navigation,
  MessageSquare,
  Phone
} from 'lucide-react'

export default function ReceiverDashboardPage() {
  const router = useRouter()
  const [receiver, setReceiver] = useState<any>(null)
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchNotifications()
  }, [])

  const checkAuth = () => {
    const receiverData = localStorage.getItem('receiver')
    if (!receiverData) {
      router.push('/receiver/login')
      return
    }
    setReceiver(JSON.parse(receiverData))
  }

  const fetchNotifications = async () => {
    try {
      const supabase = createClient()
      const receiverData = JSON.parse(localStorage.getItem('receiver') || '{}')

      const { data, error } = await supabase
        .from('delivery_notifications')
        .select(`
          *,
          order:orders(*),
          driver:drivers(name, phone)
        `)
        .eq('receiver_id', receiverData.id)
        .in('status', ['notified', 'ready_confirmed', 'gps_active'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReadyForDelivery = async (notificationId: string) => {
    try {
      const supabase = createClient()

      await supabase
        .from('delivery_notifications')
        .update({
          status: 'ready_confirmed',
          ready_confirmed_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      // Refresh notifications
      fetchNotifications()
    } catch (error) {
      console.error('Error confirming readiness:', error)
      alert('Error confirming readiness. Please try again.')
    }
  }

  const handleViewQR = (notification: DeliveryNotification) => {
    router.push(`/receiver/qr/${notification.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  if (!receiver) {
    return null // Will redirect in checkAuth
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hello, {receiver.name}!
            </h1>
            <p className="text-gray-600">Your delivery notifications</p>
          </div>

          {/* Active Deliveries */}
          {notifications.length === 0 ? (
            <Card className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No active deliveries
              </h3>
              <p className="text-gray-600">
                You'll receive a notification when your delivery is on the way
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-jeffy-yellow-light rounded-lg">
                        <Package className="w-5 h-5 text-jeffy-yellow-darker" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          Order #{notification.order?.id.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Driver: {notification.driver?.name}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      notification.status === 'notified' ? 'bg-blue-100 text-blue-700' :
                      notification.status === 'ready_confirmed' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {notification.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Delivery Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {notification.order?.delivery_info.address}
                        </p>
                        <p className="text-sm text-gray-600">
                          {notification.order?.delivery_info.city}
                        </p>
                      </div>
                    </div>

                    {notification.estimated_arrival_minutes && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <p className="text-gray-700">
                          Estimated arrival: {notification.estimated_arrival_minutes} minutes
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {notification.status === 'notified' && (
                      <Button
                        onClick={() => handleReadyForDelivery(notification.id)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Ready for Delivery
                      </Button>
                    )}

                    {notification.status === 'ready_confirmed' && (
                      <Button
                        onClick={() => handleViewQR(notification)}
                        className="flex-1"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        View QR Code
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => router.push(`/receiver/chat/${notification.id}`)}
                      className="flex-1"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message Driver
                    </Button>

                    {notification.driver?.phone && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(`tel:${notification.driver!.phone}`, '_self')}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
