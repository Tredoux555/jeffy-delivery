// Database Types - Shared with main app
export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string | null
  images: string[]
  stock: number
  has_variants: boolean
  variants?: ProductVariant[]
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string | null
  variant_attributes: Record<string, string>
  price: number | null
  stock: number
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

export interface Order {
  id: string
  user_email: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  delivery_info: DeliveryInfo
  qr_code?: string
  ready_for_delivery?: boolean
  ready_for_delivery_at?: string
  created_at: string
}

export interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  price: number
}

export interface DeliveryInfo {
  name: string
  phone: string
  address: string
  city: string
  postal_code: string
  // Optional coordinates for precise location
  latitude?: number
  longitude?: number
}

export interface Driver {
  id: string
  name: string
  email: string
  phone: string
  password_hash: string
  vehicle_type?: string
  license_number?: string
  status: 'active' | 'inactive' | 'busy'
  current_location?: { lat: number; lng: number }
  last_location_update?: string
  created_at: string
  updated_at: string
}

export interface DeliveryAssignment {
  id: string
  order_id: string
  driver_id: string
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
  assigned_at: string
  picked_up_at?: string
  delivered_at?: string
  delivery_notes?: string
  delivery_photo_url?: string
  customer_signature_url?: string
  created_at: string
  updated_at: string
  order?: Order
  driver?: Driver
}

export interface DeliveryStatusUpdate {
  id: string
  assignment_id: string
  status: string
  location?: { lat: number; lng: number }
  notes?: string
  updated_by: 'driver' | 'admin' | 'system'
  created_at: string
}

export interface DriverLocationHistory {
  id: string
  driver_id: string
  location: { lat: number; lng: number }
  created_at: string
}

