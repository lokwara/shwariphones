import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Found' : 'Missing')

if (!supabaseUrl) {
  console.error('SUPABASE_URL is not defined in environment variables')
  process.exit(1)
}

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables')
  process.exit(1)
}

export const supabase = createClient(supabaseUrl, supabaseKey)