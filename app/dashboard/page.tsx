'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { DeliveryQueue } from '@/components/DeliveryQueue'
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
  Edit,
  Bell,
  Route,
  Zap,
  TrendingUp,
  RefreshCw
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [driver, setDriver] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [availableDeliveries, setAvailableDeliveries] = useState<Order[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<DeliveryAssignment[]>([])
  const [completedToday, setCompletedToday] = useState<number>(0)
  const [earningsToday, setEarningsToday] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<'available' | 'queue'>('available')

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
      const supabase = createClient()
      const driverData = JSON.parse(localStorage.getItem('driver') || '{}')

      if (!driverData.id) return

      // Fetch available deliveries
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

      const assignedOrderIds = assignments?.map(a => a.order_id) || []
      const available = (orders || []).filter(o => !assignedOrderIds.includes(o.id))

      setAvailableDeliveries(available || [])
      setActiveDeliveries(assignments || [])
      setCompletedToday(completed?.length || 0)
      setEarningsToday((completed?.length || 0) * 20)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    checkAuth()
    fetchData()
  }, [])

  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('orders-ready-for-delivery')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: 'ready_for_delivery=eq.true'
        },
        () => fetchData()
      )
      .subscribe()

    const assignmentsChannel = supabase
      .channel('delivery-assignments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_assignments'
        },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(assignmentsChannel)
    }
  }, [])

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
      await fetchData()
      
      // Switch to queue tab if this is the first delivery
      if (activeDeliveries.length === 0) {
        setActiveTab('queue')
      }
    } catch (error) {
      console.error('Error accepting delivery:', error)
      alert('Failed to accept delivery. Please try again.')
    }
  }

  const handleAcceptAll = async () => {
    for (const order of availableDeliveries) {
      await handleAcceptDelivery(order.id)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-jeffy-yellow via-jeffy-yellow-light to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Truck className="w-16 h-16 text-jeffy-yellow-darker mx-auto mb-4 animate-bounce" />
          </div>
          <p className="text-gray-700 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-jeffy-yellow via-jeffy-yellow-light to-white">
      {/* Navigation Bar */}
      <nav className="bg-gray-900 shadow-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-jeffy-yellow rounded-xl group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">Jeffy</span>
                <span className="text-xs text-jeffy-yellow block -mt-1">Driver</span>
              </div>
            </Link>
            
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-jeffy-yellow text-gray-900 font-medium text-sm"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link
                href="/scanner"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-white hover:bg-white/10 font-medium text-sm transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Scanner</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-white hover:bg-white/10 font-medium text-sm transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        {/* Welcome & Stats */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome back, {driver?.name?.split(' ')[0] || 'Driver'}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Here&apos;s your delivery overview for today</p>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Available</p>
                  <p className="text-3xl font-bold">{availableDeliveries.length}</p>
                </div>
                <Package className="w-10 h-10 text-blue-200" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">In Queue</p>
                  <p className="text-3xl font-bold">{activeDeliveries.length}</p>
                </div>
                <Truck className="w-10 h-10 text-orange-200" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Completed</p>
                  <p className="text-3xl font-bold">{completedToday}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-200" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-jeffy-yellow-dark to-jeffy-yellow-darker text-gray-900 border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 text-sm">Earnings</p>
                  <p className="text-3xl font-bold">R{earningsToday}</p>
                </div>
                <DollarSign className="w-10 h-10 text-gray-700" />
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Button
            onClick={() => router.push('/scanner')}
            variant="outline"
            className="flex-col h-auto py-4 gap-2"
          >
            <QrCode className="w-6 h-6" />
            <span className="text-sm">Scan QR</span>
          </Button>
          <Button
            onClick={() => setActiveTab('queue')}
            variant={activeTab === 'queue' ? 'primary' : 'outline'}
            className="flex-col h-auto py-4 gap-2"
          >
            <Route className="w-6 h-6" />
            <span className="text-sm">My Queue</span>
          </Button>
          <Button
            onClick={() => router.push('/profile')}
            variant="outline"
            className="flex-col h-auto py-4 gap-2"
          >
            <User className="w-6 h-6" />
            <span className="text-sm">Profile</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-auto py-4 gap-2"
            onClick={() => alert('History feature coming soon!')}
          >
            <History className="w-6 h-6" />
            <span className="text-sm">History</span>
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'available'
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Package className="w-5 h-5" />
              <span>Available ({availableDeliveries.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'queue'
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Route className="w-5 h-5" />
              <span>My Queue ({activeDeliveries.length})</span>
            </div>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'available' ? (
          <Card shadow="lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Available Deliveries</h2>
              {availableDeliveries.length > 1 && (
                <Button size="sm" onClick={handleAcceptAll}>
                  <Zap className="w-4 h-4 mr-1" />
                  Accept All
                </Button>
              )}
            </div>
            
            {availableDeliveries.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No available deliveries at the moment</p>
                <p className="text-sm text-gray-500 mt-1">New orders will appear here automatically</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableDeliveries.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-12 h-12 bg-jeffy-yellow rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-gray-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">#{order.id.slice(0, 8)}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          New
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{order.delivery_info.name}</p>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.delivery_info.address}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptDelivery(order.id)}
                    >
                      Accept
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : (
          <DeliveryQueue
            deliveries={activeDeliveries}
            onRefresh={fetchData}
            onNavigate={(id) => router.push(`/deliveries/active/${id}`)}
          />
        )}
      </div>
    </div>
  )
}
