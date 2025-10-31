'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRScanner } from '@/components/QRScanner'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Package } from 'lucide-react'

export default function ScannerPage() {
  const router = useRouter()
  const [showScanner, setShowScanner] = useState(true)
  const [processing, setProcessing] = useState(false)

  const handleQRScan = async (orderId: string) => {
    try {
      setProcessing(true)
      const supabase = createClient()
      const driverData = JSON.parse(localStorage.getItem('driver') || '{}')

      // Get delivery assignment for this order and driver
      const { data: assignment, error: assignmentError } = await supabase
        .from('delivery_assignments')
        .select('*')
        .eq('order_id', orderId)
        .eq('driver_id', driverData.id)
        .single()

      if (assignmentError || !assignment) {
        alert('Order not assigned to you. Please contact admin.')
        setProcessing(false)
        setShowScanner(true)
        return
      }

      // Determine status update based on current status
      let newStatus: string
      let updateData: any = {}

      if (assignment.status === 'assigned') {
        // First scan: Picked up
        newStatus = 'picked_up'
        updateData = {
          status: 'picked_up',
          picked_up_at: new Date().toISOString()
        }
      } else if (assignment.status === 'picked_up' || assignment.status === 'in_transit') {
        // Second scan: Delivered
        newStatus = 'delivered'
        updateData = {
          status: 'delivered',
          delivered_at: new Date().toISOString()
        }

        // Update order status
        await supabase
          .from('orders')
          .update({ status: 'delivered' })
          .eq('id', orderId)
      } else {
        alert('This order has already been processed.')
        setProcessing(false)
        setShowScanner(true)
        return
      }

      // Update delivery assignment
      const { error: updateError } = await supabase
        .from('delivery_assignments')
        .update(updateData)
        .eq('id', assignment.id)

      if (updateError) {
        throw updateError
      }

      // Create status update record
      await supabase
        .from('delivery_status_updates')
        .insert({
          assignment_id: assignment.id,
          status: newStatus,
          updated_by: 'driver'
        })

      // Show success message
      if (newStatus === 'picked_up') {
        alert('Order picked up successfully! You can now deliver it.')
      } else {
        alert('Delivery completed! R20 added to your earnings.')
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('QR scan processing error:', error)
      alert('Error processing QR code. Please try again.')
      setProcessing(false)
      setShowScanner(true)
    }
  }

  if (processing) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <Card className="text-center p-8">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-[spin_3s_linear_infinite]" />
          </div>
          <p className="text-gray-700">Processing...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => router.push('/dashboard')}
        />
      )}
    </div>
  )
}

