import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUserManually(email, name = null) {
  try {
    console.log(`Creating user manually for: ${email}`);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email,
        name: name || email.split('@')[0], // Use email prefix if no name provided
        image: null,
        isAdmin: false,
        adminRights: [],
        phoneVerified: false,
        emailVerified: true
      })
      .select();

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    console.log('✅ User created successfully:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Get email from command line argument
const email = process.argv[2];
if (email) {
  createUserManually(email);
} else {
  console.log('Please provide an email address: node create-user-manually.js user@example.com');
}


