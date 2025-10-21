import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteSetup() {
  console.log('🧪 Testing Complete Setup...\n');

  try {
    // 1. Test if user_profiles view exists and works
    console.log('1. Testing user_profiles view...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ user_profiles view error:', profilesError.message);
    } else {
      console.log('✅ user_profiles view working');
    }

    // 2. Test direct users table access
    console.log('\n2. Testing direct users table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ users table error:', usersError.message);
    } else {
      console.log('✅ users table accessible');
      console.log('   Sample user:', users[0] ? {
        id: users[0].id,
        email: users[0].email,
        isAdmin: users[0].isAdmin,
        phoneVerified: users[0].phoneVerified
      } : 'No users found');
    }

    // 3. Test if verificationToken column exists
    console.log('\n3. Testing verificationToken column...');
    const { data: tokenTest, error: tokenError } = await supabase
      .from('users')
      .select('verificationToken')
      .limit(1);
    
    if (tokenError) {
      console.log('❌ verificationToken column error:', tokenError.message);
    } else {
      console.log('✅ verificationToken column exists');
    }

    // 4. Test RLS policies
    console.log('\n4. Testing RLS policies...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('users')
      .select('id, email, isAdmin')
      .limit(1);
    
    if (rlsError) {
      console.log('❌ RLS policy error:', rlsError.message);
    } else {
      console.log('✅ RLS policies working');
    }

    // 5. Test get_user_profile function
    console.log('\n5. Testing get_user_profile function...');
    const { data: functionTest, error: functionError } = await supabase
      .rpc('get_user_profile');
    
    if (functionError) {
      console.log('❌ get_user_profile function error:', functionError.message);
    } else {
      console.log('✅ get_user_profile function working');
    }

    console.log('\n🎉 Setup test completed!');
    console.log('\nNext steps:');
    console.log('1. Run the complete-setup.sql script in Supabase SQL Editor');
    console.log('2. Test user signup in the frontend');
    console.log('3. Test phone number updates');
    console.log('4. Test administration access');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteSetup();



