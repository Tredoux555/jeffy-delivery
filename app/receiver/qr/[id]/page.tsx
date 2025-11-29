'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { createClient } from '@/lib/supabase'
import { DeliveryNotification } from '@/types/database'
import { QrCode, ArrowLeft, CheckCircle } from 'lucide-react'
import QRCode from 'qrcode.react'

export default function ReceiverQRPage() {
  const router = useRouter()
  const params = useParams()
  const notificationId = params.id as string

  const [notification, setNotification] = useState<DeliveryNotification | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrScanned, setQrScanned] = useState(false)

  useEffect(() => {
    fetchNotification()
    setupRealtimeSubscription()
  }, [notificationId])

  const fetchNotification = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('delivery_notifications')
        .select(`
          *,
          order:orders(*),
          driver:drivers(name)
        `)
        .eq('id', notificationId)
        .single()

      if (error) throw error
      setNotification(data)
    } catch (error) {
      console.error('Error fetching notification:', error)
      alert('Error loading QR code')
      router.push('/receiver/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const supabase = createClient()

    const channel = supabase
      .channel(`qr-${notificationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_notifications',
          filter: `id=eq.${notificationId}`
        },
        (payload) => {
          const updatedNotification = payload.new as DeliveryNotification
          setNotification(updatedNotification)

          if (updatedNotification.status === 'completed') {
            setQrScanned(true)
          }
        }
      )
      .subscribe()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <QrCode className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-700">Loading QR code...</p>
        </div>
      </div>
    )
  }

  if (!notification) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <Card className="text-center p-8">
          <p className="text-gray-700 mb-4">QR code not found</p>
          <Button onClick={() => router.push('/receiver/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  if (qrScanned) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <div className="p-6 bg-green-100 rounded-full w-fit mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Delivery Completed!
          </h2>
          <p className="text-gray-600 mb-6">
            Your package has been successfully delivered. Thank you for using Jeffy!
          </p>
          <Button
            onClick={() => router.push('/receiver/dashboard')}
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="outline"
          onClick={() => router.push('/receiver/dashboard')}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="max-w-md mx-auto">
          <Card className="text-center p-6">
            <div className="p-4 bg-jeffy-yellow-light rounded-xl w-fit mx-auto mb-6">
              <QrCode className="w-8 h-8 text-jeffy-yellow-darker" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Your Delivery QR Code
            </h1>
            <p className="text-gray-600 mb-6">
              Show this QR code to your driver to complete the delivery
            </p>

            <div className="bg-white p-6 rounded-xl border-4 border-gray-200 mb-6">
              <QRCode
                value={notification.qr_code || ''}
                size={200}
                level="M"
                className="mx-auto"
              />
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Order: #{notification.order?.id.slice(0, 8)}</p>
              <p>Driver: {notification.driver?.name}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
