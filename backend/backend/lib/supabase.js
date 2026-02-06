import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Checking Supabase configuration...')
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Found' : '❌ Missing')

let supabase

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CRITICAL: Supabase environment variables are missing!')
  console.error('❌ Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Railway environment variables')
  console.error('❌ Go to Railway Dashboard → Settings → Variables to add them')
  console.error('⚠️ Server will start but database operations will fail until variables are set')
  
  // Create placeholder client - won't work but allows server to start
  // This helps with debugging - you'll see the error in logs
  supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key'
  )
} else {
  console.log('✅ Supabase client initialized successfully')
  supabase = createClient(supabaseUrl, supabaseKey)
}

export { supabase }