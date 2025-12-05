'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { LocationSharing } from '@/components/LocationSharing'
import { createClient } from '@/lib/supabase'
import { DeliveryNotification } from '@/types/database'
import Link from 'next/link'
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Navigation,
  MessageSquare,
  Phone,
  QrCode,
  Truck,
  Bell,
  LogOut,
  RefreshCw,
  User
} from 'lucide-react'

export default function ReceiverDashboardPage() {
  const router = useRouter()
  const [receiver, setReceiver] = useState<any>(null)
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchNotifications()
    setupRealtimeSubscription()
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

      if (!receiverData.id) return

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
      setRefreshing(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const supabase = createClient()
    const receiverData = JSON.parse(localStorage.getItem('receiver') || '{}')

    if (!receiverData.id) return

    const channel = supabase
      .channel('receiver-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_notifications',
          filter: `receiver_id=eq.${receiverData.id}`
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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

      fetchNotifications()
    } catch (error) {
      console.error('Error confirming readiness:', error)
      alert('Error confirming readiness. Please try again.')
    }
  }

  const handleViewQR = (notification: DeliveryNotification) => {
    router.push(`/receiver/qr/${notification.id}`)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchNotifications()
  }

  const handleLogout = () => {
    localStorage.removeItem('receiver')
    router.push('/receiver/login')
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'notified':
        return { color: 'blue', text: 'Delivery Incoming', icon: Truck }
      case 'ready_confirmed':
        return { color: 'orange', text: 'Waiting for Driver', icon: Clock }
      case 'gps_active':
        return { color: 'green', text: 'Driver En Route', icon: Navigation }
      default:
        return { color: 'gray', text: status, icon: Package }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-jeffy-yellow via-jeffy-yellow-light to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Package className="w-16 h-16 text-jeffy-yellow-darker mx-auto mb-4 animate-bounce" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full animate-ping" />
          </div>
          <p className="text-gray-700 font-medium">Loading your deliveries...</p>
        </div>
      </div>
    )
  }

  if (!receiver) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-jeffy-yellow via-jeffy-yellow-light to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/receiver/dashboard" className="flex items-center gap-2">
              <div className="p-2 bg-jeffy-yellow rounded-xl">
                <Package className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <span className="font-bold text-gray-900">Jeffy</span>
                <span className="text-xs text-gray-500 block -mt-1">Delivery Tracker</span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Card */}
          <Card className="mb-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white border-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-jeffy-yellow rounded-2xl flex items-center justify-center">
                <User className="w-7 h-7 text-gray-900" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Welcome back,</p>
                <h1 className="text-2xl font-bold">{receiver.name}</h1>
              </div>
            </div>
            
            {notifications.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                <Bell className="w-4 h-4 text-jeffy-yellow" />
                <span className="text-sm text-gray-300">
                  You have {notifications.length} active {notifications.length === 1 ? 'delivery' : 'deliveries'}
                </span>
              </div>
            )}
          </Card>

          {/* Active Deliveries */}
          {notifications.length === 0 ? (
            <Card className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Active Deliveries
              </h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                You&apos;ll receive a notification here when a delivery is on its way to you
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {notifications.map((notification) => {
                const statusInfo = getStatusInfo(notification.status)
                const StatusIcon = statusInfo.icon
                
                return (
                  <Card key={notification.id} className="overflow-hidden">
                    {/* Status Banner */}
                    <div className={`-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 py-3 mb-4 bg-gradient-to-r ${
                      notification.status === 'notified' ? 'from-blue-500 to-blue-600' :
                      notification.status === 'ready_confirmed' ? 'from-orange-500 to-orange-600' :
                      'from-green-500 to-green-600'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                          <StatusIcon className="w-5 h-5" />
                          <span className="font-semibold">{statusInfo.text}</span>
                        </div>
                        {notification.estimated_arrival_minutes && notification.status !== 'ready_confirmed' && (
                          <div className="flex items-center gap-1 text-white/90 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>~{notification.estimated_arrival_minutes} min</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          Order #{notification.order?.id.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Truck className="w-4 h-4" />
                          Driver: {notification.driver?.name || 'Assigned'}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                      <MapPin className="w-5 h-5 text-jeffy-yellow-darker mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {notification.order?.delivery_info.address}
                        </p>
                        <p className="text-sm text-gray-600">
                          {notification.order?.delivery_info.city}
                        </p>
                      </div>
                    </div>

                    {/* Location Sharing (show when ready confirmed) */}
                    {notification.status === 'ready_confirmed' && (
                      <div className="mb-4">
                        <LocationSharing
                          notificationId={notification.id}
                          onLocationEnabled={(coords) => {
                            console.log('Location enabled:', coords)
                            fetchNotifications()
                          }}
                        />
                      </div>
                    )}

                    {/* Order Items Preview */}
                    {notification.order?.items && notification.order.items.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.order.items.length} {notification.order.items.length === 1 ? 'item' : 'items'} • R{notification.order.total.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                      {notification.status === 'notified' && (
                        <Button
                          onClick={() => handleReadyForDelivery(notification.id)}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
                          size="lg"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          I&apos;m Ready for Delivery
                        </Button>
                      )}

                      {(notification.status === 'ready_confirmed' || notification.status === 'gps_active') && (
                        <Button
                          onClick={() => handleViewQR(notification)}
                          className="w-full"
                          size="lg"
                        >
                          <QrCode className="w-5 h-5 mr-2" />
                          Show QR Code to Driver
                        </Button>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/receiver/chat/${notification.id}`)}
                          className="flex-1"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat
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
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Having issues? Contact support at{' '}
              <a href="tel:+27111234567" className="text-jeffy-yellow-darker font-medium hover:underline">
                +27 11 123 4567
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
