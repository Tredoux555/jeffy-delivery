'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { createClient } from '@/lib/supabase'
import { Order, DeliveryAssignment } from '@/types/database'
import { 
  Package, 
  Truck, 
  CheckCircle, 
  DollarSign,
  LogOut,
  User,
  MapPin,
  Clock,
  QrCode
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [driver, setDriver] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [availableDeliveries, setAvailableDeliveries] = useState<Order[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<DeliveryAssignment[]>([])
  const [completedToday, setCompletedToday] = useState<number>(0)
  const [earningsToday, setEarningsToday] = useState<number>(0)
  const [ordersToProcess, setOrdersToProcess] = useState<number>(0)

  const checkAuth = () => {
    const driverData = localStorage.getItem('driver')
    if (!driverData) {
      router.push('/login')
      return
    }
    setDriver(JSON.parse(driverData))
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const driverData = JSON.parse(localStorage.getItem('driver') || '{}')

      if (!driverData.id) return

      // Fetch available deliveries (including 'confirmed' status from commerce app)
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('ready_for_delivery', true)
        .in('status', ['pending', 'confirmed', 'processing'])
        .order('ready_for_delivery_at', { ascending: true })

      // Fetch active deliveries for this driver
      const { data: assignments } = await supabase
        .from('delivery_assignments')
        .select('*, order:orders(*)')
        .eq('driver_id', driverData.id)
        .in('status', ['assigned', 'picked_up', 'in_transit'])
        .order('assigned_at', { ascending: false })

      // Fetch completed deliveries today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { data: completed } = await supabase
        .from('delivery_assignments')
        .select('*')
        .eq('driver_id', driverData.id)
        .eq('status', 'delivered')
        .gte('delivered_at', today.toISOString())

      // Filter out already assigned orders
      const assignedOrderIds = assignments?.map(a => a.order_id) || []
      const available = (orders || []).filter(o => !assignedOrderIds.includes(o.id))

      setAvailableDeliveries(available || [])
      setOrdersToProcess(available.length) // Count of unassigned orders ready for processing
      setActiveDeliveries(assignments || [])
      setCompletedToday(completed?.length || 0)
      setEarningsToday((completed?.length || 0) * 20) // R20 per delivery
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initialize auth and fetch data on mount
  useEffect(() => {
    checkAuth()
    fetchData()
  }, [])

  // Real-time subscriptions for order and assignment changes
  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to order changes where ready_for_delivery = true
    const channel = supabase
      .channel('orders-ready-for-delivery')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
          filter: 'ready_for_delivery=eq.true'
        },
        (payload) => {
          console.log('Order change detected:', payload)
          // Refresh data when orders are updated
          fetchData()
        }
      )
      .subscribe()

    // Subscribe to delivery_assignments to track when orders get assigned
    const assignmentsChannel = supabase
      .channel('delivery-assignments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_assignments'
        },
        (payload) => {
          console.log('Assignment change detected:', payload)
          fetchData()
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(assignmentsChannel)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    localStorage.removeItem('driver')
    router.push('/login')
  }

  const handleAcceptDelivery = async (orderId: string) => {
    try {
      const supabase = createClient()
      const driverData = JSON.parse(localStorage.getItem('driver') || '{}')

      const { error } = await supabase
        .from('delivery_assignments')
        .insert({
          order_id: orderId,
          driver_id: driverData.id,
          status: 'assigned'
        })

      if (error) throw error

      // Refresh data
      await fetchData()
    } catch (error) {
      console.error('Error accepting delivery:', error)
      alert('Failed to accept delivery. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-jeffy-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Package className="w-12 h-12 text-green-500 animate-[spin_3s_linear_infinite]" />
          </div>
          <p className="text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-jeffy-yellow">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Welcome back, {driver?.name || 'Driver'}!</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={() => router.push('/scanner')}
              size="sm"
              className="bg-jeffy-yellow"
            >
              <QrCode className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Scan QR</span>
              <span className="sm:hidden">Scan</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/profile')}
              size="sm"
            >
              <User className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              size="sm"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Orders to Process</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{ordersToProcess}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 border-2 border-jeffy-yellow bg-jeffy-yellow-light rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded flex items-center justify-center">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Available Deliveries</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{availableDeliveries.length}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 border-2 border-jeffy-yellow bg-jeffy-yellow-light rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded flex items-center justify-center">
                  <Package className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Active Deliveries</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{activeDeliveries.length}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 border-2 border-jeffy-yellow bg-jeffy-yellow-light rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded flex items-center justify-center">
                  <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Completed Today</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{completedToday}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 border-2 border-jeffy-yellow bg-jeffy-yellow-light rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Money Earned Today</p>
                <p className="text-lg sm:text-2xl font-bold text-jeffy-yellow truncate">R{earningsToday}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 border-2 border-jeffy-yellow bg-jeffy-yellow-light rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-jeffy-yellow rounded flex items-center justify-center">
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-900" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Available Deliveries */}
        <Card className="mb-6 sm:mb-8 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Available Deliveries</h2>
          {availableDeliveries.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No available deliveries at the moment</p>
          ) : (
            <div className="space-y-3">
              {availableDeliveries.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Customer:</strong> {order.delivery_info.name}
                      </p>
                      <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.delivery_info.address}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Ready since {order.ready_for_delivery_at ? new Date(order.ready_for_delivery_at).toLocaleTimeString() : 'N/A'}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleAcceptDelivery(order.id)}
                      size="sm"
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Deliveries */}
        {activeDeliveries.length > 0 && (
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Active Deliveries</h2>
            <div className="space-y-3">
              {activeDeliveries.map((assignment) => {
                const order = assignment.order as Order
                return (
                  <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-4 h-4 text-yellow-600" />
                          <span className="font-semibold text-gray-900">Order #{order?.id.slice(0, 8)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            assignment.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                            assignment.status === 'picked_up' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {assignment.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Customer:</strong> {order?.delivery_info.name}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order?.delivery_info.address}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/deliveries/active/${assignment.id}`)}
                        size="sm"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

