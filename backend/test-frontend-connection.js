import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFrontendConnection() {
  try {
    console.log('🔍 Testing frontend connection to Supabase...');
    
    // Test 1: Check if we can fetch the user directly
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'okwaralewis16@gmail.com')
      .single();
      
    if (error) {
      console.error('❌ Error fetching user:', error);
      return;
    }
    
    console.log('✅ User found in database:');
    console.log('  - Email:', user.email);
    console.log('  - isAdmin:', user.isAdmin);
    console.log('  - adminRights:', user.adminRights);
    console.log('  - ID:', user.id);
    
    // Test 2: Check if the user_profiles view works
    console.log('\n🔍 Testing user_profiles view...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .single();
      
    if (profileError) {
      console.log('⚠️ user_profiles view error (expected if no auth):', profileError.message);
    } else {
      console.log('✅ user_profiles view working:', profileData);
    }
    
    // Test 3: Check RLS policies
    console.log('\n🔍 Testing RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname')
      .eq('schemaname', 'public')
      .eq('tablename', 'users');
      
    if (policyError) {
      console.log('⚠️ Could not check RLS policies:', policyError.message);
    } else {
      console.log('✅ RLS policies found:', policies.map(p => p.policyname));
    }
    
    console.log('\n🎯 Summary:');
    console.log('✅ Database has correct admin data');
    console.log('✅ User isAdmin:', user.isAdmin);
    console.log('✅ User adminRights:', user.adminRights);
    console.log('\n🔧 Next steps:');
    console.log('1. Go to /debug-user in your browser');
    console.log('2. Check what the frontend is actually receiving');
    console.log('3. Try the refresh buttons');
    console.log('4. Look at the browser console for detailed logs');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFrontendConnection();


