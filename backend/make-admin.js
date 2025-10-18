import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function makeUserAdmin(email) {
  try {
    // Update user to be admin
    const { data, error } = await supabase
      .from('users')
      .update({ 
        isAdmin: true,
        adminRights: ['ADMIN_MANAGEMENT', 'INVENTORY_MANAGEMENT', 'SALES_MANAGEMENT']
      })
      .eq('email', email);

    if (error) {
      console.error('Error updating user:', error);
      return;
    }

    console.log(`✅ User ${email} is now an admin!`);
    console.log('You can now access /administration');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node make-admin.js your-email@example.com');
  process.exit(1);
}

makeUserAdmin(email);
