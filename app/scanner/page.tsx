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

      // Step 1: Validate driver session
      if (!driverData.id) {
        alert('Please login first.')
        setProcessing(false)
        router.push('/login')
        return
      }

      // Step 2: Verify order exists and is ready for delivery
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        alert('Order not found. Please check the QR code and try again.')
        setProcessing(false)
        setShowScanner(true)
        return
      }

      // Validate order is ready for delivery
      if (!order.ready_for_delivery) {
        alert('This order is not ready for delivery yet. Please contact admin.')
        setProcessing(false)
        setShowScanner(true)
        return
      }

      // Validate order status is valid
      const validStatuses = ['pending', 'confirmed', 'processing']
      if (!validStatuses.includes(order.status)) {
        if (order.status === 'cancelled') {
          alert('This order has been cancelled and cannot be delivered.')
        } else if (order.status === 'delivered') {
          alert('This order has already been delivered.')
        } else {
          alert(`Order status "${order.status}" is invalid for delivery.`)
        }
        setProcessing(false)
        setShowScanner(true)
        return
      }

      // Step 3: Check for existing assignment for this driver
      const { data: assignment, error: assignmentError } = await supabase
        .from('delivery_assignments')
        .select('*')
        .eq('order_id', orderId)
        .eq('driver_id', driverData.id)
        .single()

      let assignmentId: string

      // Step 4: Handle assignment creation or validation
      if (assignmentError || !assignment) {
        // No assignment exists for this driver - check if order is already assigned to another driver
        const { data: existingAssignment } = await supabase
          .from('delivery_assignments')
          .select('*')
          .eq('order_id', orderId)
          .single()

        if (existingAssignment) {
          alert('This order is already assigned to another driver. Please contact admin.')
          setProcessing(false)
          router.push('/dashboard')
          return
        }

        // Order is not assigned - create new assignment automatically
        const { data: newAssignment, error: createError } = await supabase
          .from('delivery_assignments')
          .insert({
            order_id: orderId,
            driver_id: driverData.id,
            status: 'assigned',
            assigned_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError || !newAssignment) {
          console.error('Error creating assignment:', createError)
          alert('Error assigning order to you. Please try again.')
          setProcessing(false)
          setShowScanner(true)
          return
        }

        currentAssignment = newAssignment
        assignmentId = newAssignment.id

        // Create status update record for assignment creation
        await supabase
          .from('delivery_status_updates')
          .insert({
            assignment_id: assignmentId,
            status: 'assigned',
            updated_by: 'driver',
            notes: 'Automatically assigned via QR scan'
          })

        alert('Order assigned to you! Loading delivery details...')
        // Redirect to delivery details page to show route and order info
        router.push(`/deliveries/active/${assignmentId}`)
        return
      }

      // Assignment exists - proceed with status progression
      assignmentId = assignment.id

      // Step 5: Handle status progression based on current assignment status
      let newStatus: string
      let updateData: any = {}

      if (assignment.status === 'assigned') {
        // First scan after assignment: Mark as picked up
        newStatus = 'picked_up'
        updateData = {
          status: 'picked_up',
          picked_up_at: new Date().toISOString()
        }
      } else if (assignment.status === 'picked_up' || assignment.status === 'in_transit') {
        // Second scan: Mark as delivered
        newStatus = 'delivered'
        updateData = {
          status: 'delivered',
          delivered_at: new Date().toISOString()
        }

        // Update order status in commerce app
        await supabase
          .from('orders')
          .update({ status: 'delivered' })
          .eq('id', orderId)
      } else if (assignment.status === 'delivered') {
        alert('This order has already been delivered.')
        setProcessing(false)
        router.push('/dashboard')
        return
      } else if (assignment.status === 'failed') {
        alert('This delivery assignment has been marked as failed. Please contact admin.')
        setProcessing(false)
        router.push('/dashboard')
        return
      } else {
        alert('This order has already been processed.')
        setProcessing(false)
        router.push('/dashboard')
        return
      }

      // Step 6: Update delivery assignment status
      const { error: updateError } = await supabase
        .from('delivery_assignments')
        .update(updateData)
        .eq('id', assignmentId)

      if (updateError) {
        console.error('Error updating assignment:', updateError)
        throw updateError
      }

      // Step 7: Create status update record
      await supabase
        .from('delivery_status_updates')
        .insert({
          assignment_id: assignmentId,
          status: newStatus,
          updated_by: 'driver',
          notes: `Status updated via QR scan: ${newStatus}`
        })

      // Step 8: Show success message and redirect
      if (newStatus === 'picked_up') {
        alert('Order picked up successfully! Loading delivery details...')
        router.push(`/deliveries/active/${assignmentId}`)
      } else if (newStatus === 'delivered') {
        alert('Delivery completed! R20 added to your earnings.')
        router.push('/dashboard')
      }
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

