import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function makeUserAdmin(email) {
  try {
    console.log(`🔧 Making user ${email} an admin...`);
    
    const { data, error } = await supabase
      .from('users')
      .update({
        isAdmin: true,
        adminRights: ['ADMIN_MANAGEMENT', 'INVENTORY_MANAGEMENT', 'SALES_MANAGEMENT']
      })
      .eq('email', email)
      .select();

    if (error) {
      console.error('❌ Error updating user:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log(`✅ User ${email} is now an admin!`);
      console.log('Admin rights:', data[0].adminRights);
      console.log('You can now access /administration');
    } else {
      console.log(`❌ User ${email} not found in database`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Make the specific user an admin
makeUserAdmin('okwaralewis16@gmail.com');



