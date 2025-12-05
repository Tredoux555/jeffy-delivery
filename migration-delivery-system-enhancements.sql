-- Delivery System Enhancements - Extended Schema

-- Receiver users table for delivery recipients
CREATE TABLE IF NOT EXISTS receiver_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  name VARCHAR(255),
  fcm_token TEXT, -- Firebase Cloud Messaging token for push notifications
  device_id TEXT, -- For anonymous device tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery notifications table for managing delivery activation
CREATE TABLE IF NOT EXISTS delivery_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES receiver_users(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'notified', 'ready_confirmed', 'gps_active', 'completed', 'cancelled'
  notified_at TIMESTAMP WITH TIME ZONE,
  ready_confirmed_at TIMESTAMP WITH TIME ZONE,
  gps_activated_at TIMESTAMP WITH TIME ZONE,
  qr_code TEXT UNIQUE, -- Unique QR code for receiver to complete delivery
  qr_generated_at TIMESTAMP WITH TIME ZONE,
  estimated_arrival_minutes INTEGER,
  actual_arrival_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GPS tracking sessions
CREATE TABLE IF NOT EXISTS gps_tracking_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  delivery_notification_id UUID NOT NULL REFERENCES delivery_notifications(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time GPS locations (with partitioning for performance)
CREATE TABLE IF NOT EXISTS gps_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES gps_tracking_sessions(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2), -- GPS accuracy in meters
  speed DECIMAL(5, 2), -- Speed in km/h
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (recorded_at);

-- In-app messages between driver and receiver
CREATE TABLE IF NOT EXISTS delivery_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  delivery_notification_id UUID NOT NULL REFERENCES delivery_notifications(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- 'driver' or 'receiver'
  sender_id UUID NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'voice', 'system'
  content TEXT,
  voice_url TEXT, -- URL to stored voice note
  voice_duration_seconds INTEGER,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Route optimization data
CREATE TABLE IF NOT EXISTS route_optimizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  optimization_date DATE NOT NULL,
  delivery_order JSONB, -- Array of delivery_notification_ids in optimized order
  total_distance_km DECIMAL(8, 2),
  total_duration_minutes INTEGER,
  waypoints JSONB, -- Route waypoints for mapping
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_receiver_users_phone ON receiver_users(phone);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_order_id ON delivery_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_status ON delivery_notifications(status);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_qr_code ON delivery_notifications(qr_code);
CREATE INDEX IF NOT EXISTS idx_gps_locations_session_id ON gps_locations(session_id);
CREATE INDEX IF NOT EXISTS idx_gps_locations_recorded_at ON gps_locations(recorded_at);
CREATE INDEX IF NOT EXISTS idx_delivery_messages_delivery_notification_id ON delivery_messages(delivery_notification_id);
CREATE INDEX IF NOT EXISTS idx_route_optimizations_driver_date ON route_optimizations(driver_id, optimization_date);

-- Create partitioning for GPS locations (monthly partitions)
CREATE TABLE IF NOT EXISTS gps_locations_y2024m11 PARTITION OF gps_locations
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE IF NOT EXISTS gps_locations_y2024m12 PARTITION OF gps_locations
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_receiver_users_updated_at ON receiver_users;
CREATE TRIGGER update_receiver_users_updated_at BEFORE UPDATE ON receiver_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_notifications_updated_at ON delivery_notifications;
CREATE TRIGGER update_delivery_notifications_updated_at BEFORE UPDATE ON delivery_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add realtime subscriptions for new tables
-- Enable Row Level Security (RLS)
ALTER TABLE receiver_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_optimizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - you'll need to expand these)
CREATE POLICY "Allow public read access to receiver_users" ON receiver_users FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert to receiver_users" ON receiver_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update to receiver_users" ON receiver_users FOR UPDATE USING (true);

-- Insert sample data for testing
INSERT INTO receiver_users (phone, name, email) VALUES
('+27 11 123 4567', 'Test Receiver', 'receiver@test.com')
ON CONFLICT (phone) DO NOTHING;

