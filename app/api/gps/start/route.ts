import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { deliveryNotificationId, driverId } = await request.json()

    if (!deliveryNotificationId || !driverId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabase = createClient()

    // Update delivery notification status
    const { error: updateError } = await supabase
      .from('delivery_notifications')
      .update({
        status: 'gps_active',
        gps_activated_at: new Date().toISOString()
      })
      .eq('id', deliveryNotificationId)

    if (updateError) throw updateError

    // Create GPS tracking session
    const { data: session, error: sessionError } = await supabase
      .from('gps_tracking_sessions')
      .insert({
        delivery_notification_id: deliveryNotificationId,
        driver_id: driverId,
        is_active: true
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: 'GPS tracking activated'
    })

  } catch (error) {
    console.error('GPS activation error:', error)
    return NextResponse.json({ error: 'Failed to activate GPS tracking' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, latitude, longitude, accuracy, speed } = await request.json()

    if (!sessionId || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabase = createClient()

    // Insert GPS location
    const { error } = await supabase
      .from('gps_locations')
      .insert({
        session_id: sessionId,
        latitude,
        longitude,
        accuracy: accuracy || null,
        speed: speed || null
      })

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('GPS location update error:', error)
    return NextResponse.json({ error: 'Failed to update GPS location' }, { status: 500 })
  }
}

