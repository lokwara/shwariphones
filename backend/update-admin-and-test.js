import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateAdminAndTest(email) {
  try {
    console.log(`🔧 Updating admin status for ${email}...`);
    
    // Update the user to be admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        isAdmin: true,
        adminRights: ['ADMIN_MANAGEMENT', 'INVENTORY_MANAGEMENT', 'SALES_MANAGEMENT'],
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select();

    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return;
    }

    console.log('✅ User updated successfully!');
    console.log('Updated user:', {
      email: updatedUser[0].email,
      isAdmin: updatedUser[0].isAdmin,
      adminRights: updatedUser[0].adminRights,
      updated_at: updatedUser[0].updated_at
    });

    console.log('\n🎯 Next steps:');
    console.log('1. Go to /admin-test in your browser');
    console.log('2. Click "🚀 Force Refresh" button');
    console.log('3. Check if isAdmin shows as true');
    console.log('4. If true, click "Go to Administration"');
    console.log('5. You should now have access to /administration');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Update the specific user
updateAdminAndTest('okwaralewis16@gmail.com');



