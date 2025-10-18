import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function forceRefreshUser(email) {
  try {
    console.log(`🔄 Force refreshing user data for ${email}...`);
    
    // First, let's verify the current state
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching user:', fetchError);
      return;
    }

    console.log('Current user data:', {
      email: currentUser.email,
      isAdmin: currentUser.isAdmin,
      adminRights: currentUser.adminRights
    });

    // Force update the user to trigger any cache invalidation
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select();

    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return;
    }

    console.log('✅ User data refreshed successfully!');
    console.log('Updated user:', {
      email: updatedUser[0].email,
      isAdmin: updatedUser[0].isAdmin,
      adminRights: updatedUser[0].adminRights,
      updated_at: updatedUser[0].updated_at
    });

    console.log('\n🎯 Next steps:');
    console.log('1. Refresh your browser page');
    console.log('2. Or sign out and sign back in');
    console.log('3. Navigate to /administration');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Force refresh the specific user
forceRefreshUser('okwaralewis16@gmail.com');


