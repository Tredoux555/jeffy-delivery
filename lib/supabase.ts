import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  console.error('Please create .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('Copy these values from /Users/tredouxwillemse/Desktop/jeffyb/.env.local')
}

// Client-side Supabase client (for use in client components)
// Using standard client instead of SSR client since we're not using Supabase Auth
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing. Please check your .env.local file.')
  }
  
  // Use standard Supabase client (not SSR) since we have custom auth
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Disable auth session persistence since we use custom auth
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

// Server-side Supabase client (for use in API routes and server components)
export function createServerClientSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing. Please check your .env.local file.')
  }
  
  // For API routes, we can use the standard Supabase client
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

