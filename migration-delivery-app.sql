-- Delivery App Database Migrations
-- Run these in your Supabase SQL editor

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  vehicle_type VARCHAR(50), -- 'car', 'bike', 'walking'
  license_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'busy'
  current_location JSONB, -- {lat, lng}
  last_location_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_assignments table
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'assigned', -- 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivery_notes TEXT,
  delivery_photo_url TEXT,
  customer_signature_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_status_updates table (audit trail)
CREATE TABLE IF NOT EXISTS delivery_status_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES delivery_assignments(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  location JSONB, -- {lat, lng}
  notes TEXT,
  updated_by VARCHAR(100), -- 'driver', 'admin', 'system'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create driver_location_history table (for location trails)
CREATE TABLE IF NOT EXISTS driver_location_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  location JSONB NOT NULL, -- {lat, lng}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add ready_for_delivery fields to orders table (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='ready_for_delivery') THEN
    ALTER TABLE orders ADD COLUMN ready_for_delivery BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='ready_for_delivery_at') THEN
    ALTER TABLE orders ADD COLUMN ready_for_delivery_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='qr_code') THEN
    ALTER TABLE orders ADD COLUMN qr_code TEXT;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order_id ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_driver_id ON delivery_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON delivery_assignments(status);
CREATE INDEX IF NOT EXISTS idx_orders_ready_for_delivery ON orders(ready_for_delivery);
CREATE INDEX IF NOT EXISTS idx_driver_location_history_driver_id ON driver_location_history(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_location_history_created_at ON driver_location_history(created_at);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_assignments_updated_at ON delivery_assignments;
CREATE TRIGGER update_delivery_assignments_updated_at BEFORE UPDATE ON delivery_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default test driver (password: driver123)
-- Password hash for 'driver123' using bcrypt (verified correct)
INSERT INTO drivers (name, email, phone, password_hash, vehicle_type, status) 
VALUES (
  'Test Driver',
  'driver@jeffy.com',
  '+27 11 123 4567',
  '$2b$10$GmPb4gpKgFlh/8v9mPEZE..wNHEUjXjXwguZUopzGHGH5sGu1CK9O',
  'car',
  'active'
) ON CONFLICT (email) DO UPDATE 
SET 
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  vehicle_type = EXCLUDED.vehicle_type,
  status = EXCLUDED.status;

