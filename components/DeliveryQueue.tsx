'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { createClient } from '@/lib/supabase'
import { DeliveryAssignment, Order } from '@/types/database'
import {
  Package,
  MapPin,
  Clock,
  Navigation,
  ChevronUp,
  ChevronDown,
  Route,
  Play,
  Phone,
  User,
  Truck,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react'

interface DeliveryQueueProps {
  deliveries: DeliveryAssignment[]
  onRefresh: () => void
  onNavigate: (assignmentId: string) => void
}

export function DeliveryQueue({ deliveries, onRefresh, onNavigate }: DeliveryQueueProps) {
  const [optimizing, setOptimizing] = useState(false)
  const [optimizedOrder, setOptimizedOrder] = useState<string[]>([])
  const [totalDistance, setTotalDistance] = useState<number>(0)
  const [totalDuration, setTotalDuration] = useState<number>(0)
  const [activeDeliveryIndex, setActiveDeliveryIndex] = useState(0)

  // Sort deliveries by optimized order if available
  const sortedDeliveries = optimizedOrder.length > 0
    ? [...deliveries].sort((a, b) => {
        const indexA = optimizedOrder.indexOf(a.id)
        const indexB = optimizedOrder.indexOf(b.id)
        return indexA - indexB
      })
    : deliveries

  const handleOptimizeRoute = async () => {
    if (deliveries.length < 2) {
      alert('Need at least 2 deliveries to optimize route')
      return
    }

    setOptimizing(true)
    try {
      const driverData = JSON.parse(localStorage.getItem('driver') || '{}')
      
      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driverData.id,
          deliveryNotificationIds: deliveries.map(d => d.id)
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setOptimizedOrder(data.optimizedRoute.map((w: any) => w.id))
        setTotalDistance(data.stats.distance)
        setTotalDuration(data.stats.duration)
      }
    } catch (error) {
      console.error('Route optimization error:', error)
    } finally {
      setOptimizing(false)
    }
  }

  const handleActivateDelivery = async (assignment: DeliveryAssignment, index: number) => {
    try {
      const supabase = createClient()
      const driverData = JSON.parse(localStorage.getItem('driver') || '{}')
      const order = assignment.order as Order

      // Activate delivery notification for receiver
      const response = await fetch('/api/deliveries/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          driverId: driverData.id,
          estimatedMinutes: Math.round((totalDuration / deliveries.length) * (index + 1)) || 30
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setActiveDeliveryIndex(index)
        onRefresh()
        alert(`Customer ${order.delivery_info.name} has been notified!`)
      }
    } catch (error) {
      console.error('Error activating delivery:', error)
      alert('Failed to notify customer')
    }
  }

  const moveDelivery = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...optimizedOrder]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= newOrder.length) return
    
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]]
    setOptimizedOrder(newOrder)
  }

  if (deliveries.length === 0) {
    return (
      <Card className="text-center py-12">
        <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Deliveries</h3>
        <p className="text-gray-600">Accept deliveries from the dashboard to start your route</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Route Stats & Controls */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Route className="w-6 h-6 text-jeffy-yellow" />
              Delivery Queue
            </h2>
            <p className="text-gray-400 mt-1">{deliveries.length} deliveries in queue</p>
          </div>
          <Button
            onClick={handleOptimizeRoute}
            disabled={optimizing || deliveries.length < 2}
            className="bg-jeffy-yellow text-gray-900 hover:bg-jeffy-yellow-dark"
          >
            {optimizing ? (
              <>
                <Zap className="w-4 h-4 mr-2 animate-pulse" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Optimize Route
              </>
            )}
          </Button>
        </div>

        {/* Route Stats */}
        {optimizedOrder.length > 0 && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-white/10 rounded-xl">
            <div className="text-center">
              <p className="text-3xl font-bold text-jeffy-yellow">{totalDistance.toFixed(1)} km</p>
              <p className="text-sm text-gray-400">Total Distance</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-jeffy-yellow">{totalDuration} min</p>
              <p className="text-sm text-gray-400">Est. Duration</p>
            </div>
          </div>
        )}
      </Card>

      {/* Delivery List */}
      <div className="space-y-4">
        {sortedDeliveries.map((assignment, index) => {
          const order = assignment.order as Order
          const isActive = index === activeDeliveryIndex
          const isCompleted = assignment.status === 'delivered'
          
          return (
            <Card 
              key={assignment.id}
              className={`relative overflow-hidden transition-all ${
                isActive ? 'ring-2 ring-jeffy-yellow shadow-jeffy-lg' : ''
              } ${isCompleted ? 'opacity-60' : ''}`}
            >
              {/* Position indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                isCompleted ? 'bg-green-500' :
                isActive ? 'bg-jeffy-yellow' :
                'bg-gray-300'
              }`} />

              <div className="pl-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      isCompleted ? 'bg-green-500' :
                      isActive ? 'bg-jeffy-yellow text-gray-900' :
                      'bg-gray-400'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Order #{order?.id.slice(0, 8)}
                      </h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        assignment.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                        assignment.status === 'picked_up' ? 'bg-orange-100 text-orange-700' :
                        assignment.status === 'in_transit' ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {assignment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Reorder buttons */}
                  {optimizedOrder.length > 0 && !isCompleted && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveDelivery(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveDelivery(index, 'down')}
                        disabled={index === sortedDeliveries.length - 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{order?.delivery_info.name}</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-sm">{order?.delivery_info.address}</span>
                  </div>
                  {order?.delivery_info.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${order.delivery_info.phone}`} className="text-sm hover:text-jeffy-yellow-darker">
                        {order.delivery_info.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {!isCompleted && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onNavigate(assignment.id)}
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Navigate
                      </Button>
                      
                      {!isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleActivateDelivery(assignment, index)}
                        >
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Notify Customer
                        </Button>
                      )}

                      {isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-50 border-green-200 text-green-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          In Progress
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

