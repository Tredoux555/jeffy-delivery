import { NextRequest, NextResponse } from 'next/server'
import { createServerClientSupabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password, vehicleType } = await request.json()

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = createServerClientSupabase()
    
    // Check if driver already exists
    const { data: existing } = await supabase
      .from('drivers')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const { data: driver, error } = await supabase
      .from('drivers')
      .insert({
        name,
        email,
        phone,
        password_hash: passwordHash,
        vehicle_type: vehicleType || 'car',
        status: 'active'
      })
      .select('id, email, name, status')
      .single()

    if (error) {
      console.error('Registration error:', error)
      return NextResponse.json(
        { success: false, error: 'Registration failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      driver: {
        id: driver.id,
        email: driver.email,
        name: driver.name,
        status: driver.status
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}

