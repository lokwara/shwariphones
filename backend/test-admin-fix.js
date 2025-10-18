import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminFix() {
  try {
    console.log('🔍 Testing admin fix...');
    
    // Get your user from public.users table
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'okwaralewis16@gmail.com')
      .single();
      
    if (error) {
      console.error('❌ Error fetching user:', error);
      return;
    }
    
    console.log('✅ User found in public.users:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - isAdmin:', user.isAdmin);
    console.log('  - adminRights:', user.adminRights);
    
    if (user.isAdmin) {
      console.log('✅ User is admin in public.users table');
      console.log('🎯 The frontend should now work correctly!');
      console.log('\n📋 Next steps:');
      console.log('1. Go to /debug-user in your browser');
      console.log('2. Check if isAdmin shows as true');
      console.log('3. Try the refresh buttons');
      console.log('4. Navigate to /administration');
    } else {
      console.log('❌ User is not admin in public.users table');
      console.log('🔧 Need to update the database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAdminFix();


