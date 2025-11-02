'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { createClient } from '@/lib/supabase'
import { Order, DeliveryAssignment } from '@/types/database'
import Link from 'next/link'
import { 
  Package, 
  Truck, 
  CheckCircle, 
  DollarSign,
  LogOut,
  User,
  MapPin,
  Clock,
  QrCode,
  History,
  Edit
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
      {/* Navigation Bar */}
      <nav className="bg-jeffy-grey shadow-jeffy">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-jeffy-yellow" />
              <span className="text-xl font-bold text-white">Jeffy</span>
              <span className="text-sm text-jeffy-yellow-light">Delivery</span>
            </Link>
            
            {/* Navigation Items */}
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors bg-jeffy-yellow text-gray-900"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link
                href="/scanner"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-white hover:bg-jeffy-yellow-light hover:text-gray-900"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Scanner</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-white hover:bg-jeffy-yellow-light hover:text-gray-900"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Driver Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your deliveries</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Orders to Process</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{ordersToProcess}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2">
                <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Available Deliveries</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{availableDeliveries.length}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2">
                <Package className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Active Deliveries</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{activeDeliveries.length}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2">
                <Truck className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Completed Today</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{completedToday}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2">
                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-jeffy-lg transition-all duration-300 cursor-pointer group p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Money Earned Today</p>
                <p className="text-lg sm:text-2xl font-bold text-jeffy-yellow truncate">R{earningsToday}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-jeffy-yellow rounded-lg flex items-center justify-center sm:group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ml-2">
                <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-gray-900" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">QR Scanner</h3>
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Scan QR codes to update delivery status</p>
            <Button
              onClick={() => router.push('/scanner')}
              className="w-full text-sm sm:text-base"
            >
              <QrCode className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Scan QR Code
            </Button>
          </Card>
          
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Active Deliveries</h3>
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">View and manage your active deliveries</p>
            <Button
              onClick={() => {
                if (activeDeliveries.length > 0) {
                  router.push(`/deliveries/active/${activeDeliveries[0].id}`)
                }
              }}
              className="w-full text-sm sm:text-base"
              disabled={activeDeliveries.length === 0}
            >
              <Truck className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              View Deliveries
            </Button>
          </Card>
          
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Profile Management</h3>
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Update your driver profile and settings</p>
            <Button
              onClick={() => router.push('/profile')}
              className="w-full text-sm sm:text-base"
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Manage Profile
            </Button>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delivery History</h3>
              <History className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">View completed deliveries and earnings</p>
            <Button
              onClick={() => {
                // Future: Navigate to delivery history page
                alert('Delivery history feature coming soon!')
              }}
              className="w-full text-sm sm:text-base"
            >
              <History className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              View History
            </Button>
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

        {/* Recent Activity */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Activity</h3>
          <div className="space-y-2 sm:space-y-3">
            {completedToday > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray-600">Delivery completed today</span>
                </div>
                <span className="text-xs text-gray-500">Today</span>
              </div>
            )}
            {activeDeliveries.length > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray-600">Active delivery in progress</span>
                </div>
                <span className="text-xs text-gray-500">Active</span>
              </div>
            )}
            {availableDeliveries.length > 0 && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray-600">New delivery available</span>
                </div>
                <span className="text-xs text-gray-500">Now</span>
              </div>
            )}
            {completedToday === 0 && activeDeliveries.length === 0 && availableDeliveries.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">No recent activity</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

