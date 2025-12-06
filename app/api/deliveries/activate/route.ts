import { NextRequest, NextResponse } from 'next/server'
import { createServerClientSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { orderId, driverId, estimatedMinutes } = await request.json()

    if (!orderId || !driverId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabase = createServerClientSupabase()

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if receiver user exists, create if not
    let receiverUser
    const { data: existingReceiver, error: receiverError } = await supabase
      .from('receiver_users')
      .select('*')
      .eq('phone', order.delivery_info.phone)
      .single()

    if (receiverError || !existingReceiver) {
      // Create new receiver user
      const { data: newReceiver, error: createError } = await supabase
        .from('receiver_users')
        .insert({
          phone: order.delivery_info.phone,
          name: order.delivery_info.name,
          email: order.delivery_info.email || null
        })
        .select()
        .single()

      if (createError) throw createError
      receiverUser = newReceiver
    } else {
      receiverUser = existingReceiver
    }

    // Generate unique QR code
    const qrCode = generateUniqueQR()

    // Create delivery notification
    const { data: notification, error: notifError } = await supabase
      .from('delivery_notifications')
      .insert({
        order_id: orderId,
        receiver_id: receiverUser.id,
        driver_id: driverId,
        status: 'notified',
        notified_at: new Date().toISOString(),
        qr_code: qrCode,
        qr_generated_at: new Date().toISOString(),
        estimated_arrival_minutes: estimatedMinutes || 30
      })
      .select()
      .single()

    if (notifError) throw notifError

    // TODO: Send push notification to receiver
    // await sendPushNotification(receiverUser, notification)

    return NextResponse.json({
      success: true,
      notification: notification,
      receiver: receiverUser,
      qrCode: qrCode
    })

  } catch (error) {
    console.error('Delivery activation error:', error)
    return NextResponse.json({ error: 'Failed to activate delivery' }, { status: 500 })
  }
}

function generateUniqueQR(): string {
  // Generate a unique QR code string
  return `JEFFY-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}


