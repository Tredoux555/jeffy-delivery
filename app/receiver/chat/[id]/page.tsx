'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChatDialog } from '@/components/ChatDialog'
import { createClient } from '@/lib/supabase'
import { DeliveryNotification } from '@/types/database'
import { Package } from 'lucide-react'

export default function ReceiverChatPage() {
  const router = useRouter()
  const params = useParams()
  const notificationId = params.id as string
  
  const [notification, setNotification] = useState<DeliveryNotification | null>(null)
  const [receiver, setReceiver] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchNotification()
  }, [notificationId])

  const checkAuth = () => {
    const receiverData = localStorage.getItem('receiver')
    if (!receiverData) {
      router.push('/receiver/login')
      return
    }
    setReceiver(JSON.parse(receiverData))
  }

  const fetchNotification = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('delivery_notifications')
        .select(`
          *,
          driver:drivers(id, name, phone)
        `)
        .eq('id', notificationId)
        .single()

      if (error) throw error
      setNotification(data)
    } catch (error) {
      console.error('Error fetching notification:', error)
      router.push('/receiver/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !receiver) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-700">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!notification) {
    return null
  }

  return (
    <ChatDialog
      notificationId={notificationId}
      userType="receiver"
      userId={receiver.id}
      otherUserName={notification.driver?.name || 'Driver'}
      otherUserPhone={notification.driver?.phone}
      onClose={() => router.push('/receiver/dashboard')}
    />
  )
}

