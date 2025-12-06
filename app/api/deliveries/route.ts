import { NextRequest, NextResponse } from 'next/server'
import { createServerClientSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { driverId, deliveryNotificationIds } = await request.json()

    if (!driverId || !deliveryNotificationIds || !Array.isArray(deliveryNotificationIds)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabase = createServerClientSupabase()

    // Get delivery locations
    const { data: notifications, error } = await supabase
      .from('delivery_notifications')
      .select(`
        id,
        order:orders(
          delivery_info
        )
      `)
      .in('id', deliveryNotificationIds)
      .eq('driver_id', driverId)

    if (error) throw error

    // Extract coordinates for route optimization
    const waypoints = (notifications || [])
      .filter((n: any) => n.order?.delivery_info?.latitude && n.order?.delivery_info?.longitude)
      .map((n: any) => ({
        id: n.id,
        lat: n.order.delivery_info.latitude,
        lng: n.order.delivery_info.longitude,
        address: n.order.delivery_info.address
      }))

    // Simple nearest neighbor algorithm (can be enhanced with Google Maps Directions API)
    const optimizedOrder = optimizeRoute(waypoints)

    // Calculate total distance and duration (simplified)
    const routeStats = calculateRouteStats(optimizedOrder)

    // Save optimization
    const { data: optimization, error: optError } = await supabase
      .from('route_optimizations')
      .insert({
        driver_id: driverId,
        optimization_date: new Date().toISOString().split('T')[0],
        delivery_order: optimizedOrder.map(w => w.id),
        total_distance_km: routeStats.distance,
        total_duration_minutes: routeStats.duration,
        waypoints: optimizedOrder
      })
      .select()
      .single()

    if (optError) throw optError

    return NextResponse.json({
      success: true,
      optimizedRoute: optimizedOrder,
      stats: routeStats,
      optimizationId: optimization.id
    })

  } catch (error) {
    console.error('Route optimization error:', error)
    return NextResponse.json({ error: 'Failed to optimize route' }, { status: 500 })
  }
}

// Simple route optimization using nearest neighbor algorithm
function optimizeRoute(waypoints: any[]): any[] {
  if (waypoints.length <= 1) return waypoints

  const optimized = [waypoints[0]]
  const remaining = waypoints.slice(1)

  while (remaining.length > 0) {
    const last = optimized[optimized.length - 1]
    let nearestIndex = 0
    let nearestDistance = calculateDistance(last, remaining[0])

    for (let i = 1; i < remaining.length; i++) {
      const distance = calculateDistance(last, remaining[i])
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
      }
    }

    optimized.push(remaining[nearestIndex])
    remaining.splice(nearestIndex, 1)
  }

  return optimized
}

function calculateDistance(point1: any, point2: any): number {
  const R = 6371 // Earth's radius in km
  const dLat = (point1.lat - point2.lat) * Math.PI / 180
  const dLon = (point1.lng - point2.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function calculateRouteStats(route: any[]): { distance: number, duration: number } {
  let totalDistance = 0
  let totalDuration = 0

  for (let i = 0; i < route.length - 1; i++) {
    const distance = calculateDistance(route[i], route[i + 1])
    totalDistance += distance
    // Assume average speed of 30 km/h for duration calculation
    totalDuration += (distance / 30) * 60
  }

  return {
    distance: Math.round(totalDistance * 100) / 100,
    duration: Math.round(totalDuration)
  }
}
