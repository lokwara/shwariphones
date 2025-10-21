import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserIDMismatch() {
  try {
    console.log('🔍 Checking for user ID mismatch between auth and public.users...');
    
    // Get all users from public.users table
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, isAdmin, adminRights');
      
    if (allUsersError) {
      console.error('❌ Error fetching all users:', allUsersError);
      return;
    }
    
    console.log('📋 Users in public.users table:');
    allUsers.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    isAdmin: ${user.isAdmin}`);
      console.log(`    adminRights: ${JSON.stringify(user.adminRights)}`);
      console.log('');
    });
    
    // Check if there are multiple users with the same email
    const emailCounts = {};
    allUsers.forEach(user => {
      emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
    });
    
    console.log('📊 Email counts:');
    Object.entries(emailCounts).forEach(([email, count]) => {
      console.log(`  - ${email}: ${count} user(s)`);
    });
    
    // Check specifically for your email
    const yourUsers = allUsers.filter(u => u.email === 'okwaralewis16@gmail.com');
    console.log(`\n🎯 Users with your email (${yourUsers.length} found):`);
    yourUsers.forEach((user, index) => {
      console.log(`  User ${index + 1}:`);
      console.log(`    - ID: ${user.id}`);
      console.log(`    - isAdmin: ${user.isAdmin}`);
      console.log(`    - adminRights: ${JSON.stringify(user.adminRights)}`);
    });
    
    if (yourUsers.length > 1) {
      console.log('\n⚠️ WARNING: Multiple users found with your email!');
      console.log('This could cause the frontend to fetch the wrong user.');
    } else if (yourUsers.length === 1) {
      console.log('\n✅ Found exactly one user with your email');
      if (yourUsers[0].isAdmin) {
        console.log('✅ User is admin - database is correct');
        console.log('🔧 The issue is likely in the frontend user ID matching');
      } else {
        console.log('❌ User is not admin in database');
      }
    } else {
      console.log('\n❌ No users found with your email in public.users table!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserIDMismatch();



