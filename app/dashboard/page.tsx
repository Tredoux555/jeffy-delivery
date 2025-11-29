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
      <nav className="bg-jeffy-grey shadow-jeffy-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2.5 group">
              <div className="p-1.5 bg-jeffy-yellow rounded-lg group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-gray-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white leading-tight">Jeffy</span>
                <span className="text-xs text-jeffy-yellow-light leading-tight">Delivery</span>
              </div>
            </Link>
            
            {/* Navigation Items */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl transition-all bg-jeffy-yellow text-gray-900 shadow-jeffy font-medium hover:shadow-jeffy-lg hover:-translate-y-0.5"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link
                href="/scanner"
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl transition-all text-white hover:bg-jeffy-yellow-light hover:text-gray-900 font-medium"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Scanner</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl transition-all text-white hover:bg-jeffy-yellow-light hover:text-gray-900 font-medium"
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Driver Dashboard</h1>
            <p className="text-base text-gray-600">Manage your deliveries</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
          <Card hover interactive className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1.5 font-medium">Orders to Process</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{ordersToProcess}</p>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-jeffy-yellow-dark to-jeffy-yellow-darker rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ml-3">
                <Clock className="w-5 h-5 sm:w-7 sm:h-7 text-jeffy-yellow-light" />
              </div>
            </div>
          </Card>

          <Card hover interactive className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1.5 font-medium">Available Deliveries</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{availableDeliveries.length}</p>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ml-3">
                <Package className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
            </div>
          </Card>

          <Card hover interactive className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1.5 font-medium">Active Deliveries</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{activeDeliveries.length}</p>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ml-3">
                <Truck className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
            </div>
          </Card>

          <Card hover interactive className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1.5 font-medium">Completed Today</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{completedToday}</p>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ml-3">
                <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
            </div>
          </Card>

          <Card hover interactive className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1.5 font-medium">Money Earned Today</p>
                <p className="text-2xl sm:text-3xl font-bold text-jeffy-yellow-darker truncate">R{earningsToday}</p>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-jeffy-yellow to-jeffy-yellow-dark rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ml-3">
                <DollarSign className="w-5 h-5 sm:w-7 sm:h-7 text-gray-900" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card hover className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">QR Scanner</h3>
              <div className="p-2 bg-jeffy-yellow-light rounded-lg">
                <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-jeffy-yellow-darker" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">Scan QR codes to update delivery status</p>
            <Button
              onClick={() => router.push('/scanner')}
              className="w-full"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR Code
            </Button>
          </Card>
          
          <Card hover className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Active Deliveries</h3>
              <div className="p-2 bg-jeffy-yellow-light rounded-lg">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-jeffy-yellow-darker" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">View and manage your active deliveries</p>
            <Button
              onClick={() => {
                if (activeDeliveries.length > 0) {
                  router.push(`/deliveries/active/${activeDeliveries[0].id}`)
                }
              }}
              className="w-full"
              disabled={activeDeliveries.length === 0}
            >
              <Truck className="w-4 h-4 mr-2" />
              View Deliveries
            </Button>
          </Card>
          
          <Card hover className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Profile Management</h3>
              <div className="p-2 bg-jeffy-yellow-light rounded-lg">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-jeffy-yellow-darker" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">Update your driver profile and settings</p>
            <Button
              onClick={() => router.push('/profile')}
              className="w-full"
            >
              <Edit className="w-4 h-4 mr-2" />
              Manage Profile
            </Button>
          </Card>

          <Card hover className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Delivery History</h3>
              <div className="p-2 bg-jeffy-yellow-light rounded-lg">
                <History className="w-5 h-5 sm:w-6 sm:h-6 text-jeffy-yellow-darker" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">View completed deliveries and earnings</p>
            <Button
              onClick={() => {
                // Future: Navigate to delivery history page
                alert('Delivery history feature coming soon!')
              }}
              className="w-full"
            >
              <History className="w-4 h-4 mr-2" />
              View History
            </Button>
          </Card>
        </div>

        {/* Available Deliveries */}
        <Card className="mb-8" shadow="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Available Deliveries</h2>
            <span className="px-3 py-1 bg-jeffy-yellow-light text-jeffy-yellow-darker rounded-full text-sm font-semibold">
              {availableDeliveries.length}
            </span>
          </div>
          {availableDeliveries.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No available deliveries at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableDeliveries.map((order) => (
                <div key={order.id} className="border-2 border-gray-200 rounded-xl p-5 hover:border-jeffy-yellow/50 transition-all hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-jeffy-yellow-light rounded-lg">
                          <Package className="w-4 h-4 text-jeffy-yellow-darker" />
                        </div>
                        <span className="font-bold text-gray-900">Order #{order.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 font-medium">
                        <span className="text-gray-600">Customer:</span> {order.delivery_info.name}
                      </p>
                      <p className="text-sm text-gray-600 mb-2 flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{order.delivery_info.address}</span>
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Ready since {order.ready_for_delivery_at ? new Date(order.ready_for_delivery_at).toLocaleTimeString() : 'N/A'}</span>
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
          <Card className="mb-8" shadow="lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Active Deliveries</h2>
              <span className="px-3 py-1 bg-jeffy-yellow-light text-jeffy-yellow-darker rounded-full text-sm font-semibold">
                {activeDeliveries.length}
              </span>
            </div>
            <div className="space-y-4">
              {activeDeliveries.map((assignment) => {
                const order = assignment.order as Order
                return (
                  <div key={assignment.id} className="border-2 border-gray-200 rounded-xl p-5 hover:border-jeffy-yellow/50 transition-all hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <div className="p-1.5 bg-yellow-100 rounded-lg">
                            <Truck className="w-4 h-4 text-yellow-600" />
                          </div>
                          <span className="font-bold text-gray-900">Order #{order?.id.slice(0, 8)}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            assignment.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                            assignment.status === 'picked_up' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {assignment.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 font-medium">
                          <span className="text-gray-600">Customer:</span> {order?.delivery_info.name}
                        </p>
                        <p className="text-sm text-gray-600 flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{order?.delivery_info.address}</span>
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
        <Card shadow="lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-3">
            {completedToday > 0 && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-700 font-medium">Delivery completed today</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">Today</span>
              </div>
            )}
            {activeDeliveries.length > 0 && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-700 font-medium">Active delivery in progress</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">Active</span>
              </div>
            )}
            {availableDeliveries.length > 0 && (
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-700 font-medium">New delivery available</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">Now</span>
              </div>
            )}
            {completedToday === 0 && activeDeliveries.length === 0 && availableDeliveries.length === 0 && (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

