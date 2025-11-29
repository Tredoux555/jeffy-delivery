'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { createClient } from '@/lib/supabase'
import { DeliveryAssignment, Order } from '@/types/database'
import { DeliveryMap } from '@/components/DeliveryMap'
import { 
  ArrowLeft,
  Package,
  MapPin,
  Navigation,
  CheckCircle,
  Clock,
  Phone,
  User
} from 'lucide-react'

export default function ActiveDeliveryPage() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string
  
  const [assignment, setAssignment] = useState<DeliveryAssignment | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDelivery()
  }, [assignmentId])

  const fetchDelivery = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select('*, order:orders(*)')
        .eq('id', assignmentId)
        .single()

      if (error) throw error

      setAssignment(data as DeliveryAssignment)
      setOrder((data as any).order as Order)
    } catch (error) {
      console.error('Error fetching delivery:', error)
      alert('Error loading delivery details')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = () => {
    if (!order) return
    
    // Use coordinates if available for more accurate navigation, otherwise use address
    const mapsUrl = order.delivery_info.latitude && order.delivery_info.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${order.delivery_info.latitude},${order.delivery_info.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery_info.address)}`
    
    window.open(mapsUrl, '_blank')
  }

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const supabase = createClient()
      const updateData: any = { status: newStatus }

      if (newStatus === 'picked_up') {
        updateData.picked_up_at = new Date().toISOString()
      } else if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
        // Update order status
        await supabase
          .from('orders')
          .update({ status: 'delivered' })
          .eq('id', order!.id)
      }

      await supabase
        .from('delivery_assignments')
        .update(updateData)
        .eq('id', assignmentId)

      // Create status update record
      await supabase
        .from('delivery_status_updates')
        .insert({
          assignment_id: assignmentId,
          status: newStatus,
          updated_by: 'driver'
        })

      alert(`Status updated to ${newStatus.replace('_', ' ')}`)
      await fetchDelivery()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    }
  }

  const handleCallCustomer = () => {
    if (!order) return
    window.open(`tel:${order.delivery_info.phone}`, '_self')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-[spin_3s_linear_infinite]" />
          </div>
          <p className="text-gray-700">Loading delivery details...</p>
        </div>
      </div>
    )
  }

  if (!assignment || !order) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <Card className="text-center p-8">
          <p className="text-gray-700 mb-4">Delivery not found</p>
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
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        {/* Delivery Details */}
        <Card className="mb-8" shadow="lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-jeffy-yellow-light rounded-xl">
                <Package className="w-6 h-6 text-jeffy-yellow-darker" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Order #{order.id.slice(0, 8)}
                </h1>
                <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold ${
                  assignment.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                  assignment.status === 'picked_up' ? 'bg-yellow-100 text-yellow-700' :
                  assignment.status === 'in_transit' ? 'bg-purple-100 text-purple-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {assignment.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-5 mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-jeffy-yellow-darker" />
                Customer Information
              </h3>
              <div className="bg-jeffy-yellow-light rounded-xl p-5 border-2 border-jeffy-yellow/30 shadow-sm space-y-3">
                <p className="text-gray-900 font-bold text-lg">{order.delivery_info.name}</p>
                <p className="text-gray-700 flex items-center gap-2 font-medium">
                  <Phone className="w-4 h-4 text-jeffy-yellow-darker" />
                  <a href={`tel:${order.delivery_info.phone}`} className="hover:text-jeffy-yellow-darker hover:underline transition-colors">
                    {order.delivery_info.phone}
                  </a>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-jeffy-yellow-darker" />
                Delivery Address
              </h3>
              <div className="bg-jeffy-yellow-light rounded-xl p-5 border-2 border-jeffy-yellow/30 shadow-sm">
                <p className="text-gray-900 font-medium flex items-start gap-2 mb-2">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-jeffy-yellow-darker" />
                  <span>{order.delivery_info.address}</span>
                </p>
                {order.delivery_info.city && (
                  <p className="text-gray-700 ml-6 font-medium">{order.delivery_info.city}</p>
                )}
                {order.delivery_info.postal_code && (
                  <p className="text-gray-700 ml-6 font-medium">{order.delivery_info.postal_code}</p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-jeffy-yellow-darker" />
                Order Items
              </h3>
              <div className="bg-jeffy-yellow-light rounded-xl p-5 border-2 border-jeffy-yellow/30 shadow-sm space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-jeffy-yellow/30 last:border-0">
                    <span className="text-gray-900 font-medium">{item.product_name} <span className="text-gray-600">(Qty: {item.quantity})</span></span>
                    <span className="text-gray-700 font-bold">R{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t-2 border-jeffy-yellow/50 pt-3 flex justify-between items-center mt-2">
                  <span className="text-gray-900 font-bold text-lg">Total</span>
                  <span className="text-jeffy-yellow-darker font-bold text-xl">R{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-6 border-b-2 border-gray-200">
            <Button
              onClick={handleNavigate}
              className="flex-1 flex items-center justify-center gap-2"
              size="lg"
            >
              <Navigation className="w-5 h-5" />
              Navigate to Delivery
            </Button>
            <Button
              variant="outline"
              onClick={handleCallCustomer}
              className="flex items-center justify-center gap-2"
              size="lg"
            >
              <Phone className="w-5 h-5" />
              Call Customer
            </Button>
          </div>

          {/* Status Update Buttons */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Update Status</h3>
            <div className="flex flex-wrap gap-3">
              {assignment.status === 'assigned' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('picked_up')}
                  size="md"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Mark as Picked Up
                </Button>
              )}
              {(assignment.status === 'picked_up' || assignment.status === 'in_transit') && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('in_transit')}
                  size="md"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Mark as In Transit
                </Button>
              )}
              {(assignment.status === 'picked_up' || assignment.status === 'in_transit') && (
                <Button
                  onClick={() => handleStatusUpdate('delivered')}
                  size="md"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Delivered
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Map */}
        {order.delivery_info.address && (
          <Card shadow="lg">
            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-jeffy-yellow-darker" />
              Delivery Route
            </h3>
            <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner">
              <DeliveryMap
                pickupAddress="123 Main Street, Johannesburg, 2000"
                deliveryAddress={order.delivery_info.address}
                deliveryCoords={
                  order.delivery_info.latitude && order.delivery_info.longitude
                    ? { lat: order.delivery_info.latitude, lng: order.delivery_info.longitude }
                    : undefined
                }
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

