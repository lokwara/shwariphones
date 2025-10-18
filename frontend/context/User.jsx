import { GET_USER } from "@/lib/request";
import { useSupabaseSession } from "@/lib/supabaseBrowser";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "urql";

const UserContext = createContext();

function UserProvider({ children }) {
  const { session, loading } = useSupabaseSession();
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  console.log("🔍 SUPABASE SESSION DEBUG:");
  console.log("Supabase session:", session);
  console.log("User email:", session?.user?.email);
  console.log("User ID from session:", session?.user?.id);
  console.log("User metadata:", session?.user?.user_metadata);
  console.log("Session loading:", loading);
  console.log("Session exists:", !!session);
  console.log("User exists:", !!session?.user);

  // Fetch user profile using the seamless approach with cache busting
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user) {
        setUserProfile(null);
        return;
      }

      setProfileLoading(true);
      try {
        // Add cache busting timestamp to prevent caching issues
        const timestamp = Date.now();
        console.log(`🔍 Fetching user profile with cache busting: ${timestamp}`);
        console.log(`🔍 Session user ID: ${session.user.id}`);
        console.log(`🔍 Session user email: ${session.user.email}`);
        
        // PRIORITIZE EMAIL-BASED LOOKUP as the single source of truth
        console.log('🔍 Querying users table with EMAIL (primary method):', session.user.email);
        const { data: emailData, error: emailError } = await supabaseBrowser
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

          if (emailError) {
            console.log('❌ User not found by email, trying by ID as fallback...', emailError);
            
            // Try to find user by ID as fallback
            const { data: directData, error: directError } = await supabaseBrowser
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (directError) {
              console.log('❌ User not found by ID either, creating profile...', directError);
              
              // Create user profile with all required fields
              const { data: newUser, error: createError } = await supabaseBrowser
                .from('users')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0],
                  image: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
                  isAdmin: false,
                  adminRights: '[]',
                  phoneVerified: false,
                  emailVerified: true,
                  phoneNumber: null,
                  verificationToken: null
                })
                .select()
                .single();

              if (createError) {
                console.error('Error creating user profile:', createError);
                setUserProfile(null);
              } else {
                console.log('User profile created:', newUser);
                setUserProfile(newUser);
                setRefreshTrigger(prev => prev + 1);
              }
            } else {
              console.log('✅ User found by ID (fallback):', directData);
              console.log('✅ Admin status from ID lookup:', directData.isAdmin);
              setUserProfile(directData);
              setRefreshTrigger(prev => prev + 1);
            }
          } else {
            console.log('✅ User profile loaded from EMAIL lookup (primary):', emailData);
            console.log('✅ Admin status from database:', emailData.isAdmin);
            console.log('✅ Admin rights from database:', emailData.adminRights);
            setUserProfile(emailData);
            setRefreshTrigger(prev => prev + 1);
          }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [session]);

  // Fallback to GraphQL for additional data if needed
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_USER,
    variables: {
      email: session?.user?.email || userProfile?.email,
    },
    pause: !session?.user?.email && !userProfile?.email, // Pause only if no email available
  });

  console.log("🔍 GRAPHQL DEBUG:");
  console.log("GraphQL data:", data);
  console.log("GraphQL error:", error);
  console.log("GraphQL fetching:", fetching);
  console.log("Session email for GraphQL:", session?.user?.email);
  console.log("UserProfile email for GraphQL:", userProfile?.email);
  console.log("Final email used:", session?.user?.email || userProfile?.email);
  console.log("GraphQL query paused:", !session?.user?.email && !userProfile?.email);

  // Create a combined user object that prioritizes Supabase profile data
  // This will update whenever userProfile, session, or data changes
  const combinedUser = React.useMemo(() => {
    if (!session?.user) return null;
    
    return {
      // Use Supabase profile as primary source, fallback to session data
      id: userProfile?.id || session.user.id,
      email: userProfile?.email || session.user.email,
      name: userProfile?.name || session.user.user_metadata?.full_name || session.user.user_metadata?.name,
      image: userProfile?.image || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
      
      // Profile data from Supabase
      ...(userProfile && {
        isAdmin: userProfile.isAdmin,
        phoneNumber: userProfile.phoneNumber,
        phoneVerified: userProfile.phoneVerified,
        adminRights: userProfile.adminRights,
      }),
      
      // Additional data from GraphQL if available
      ...(data?.getUser && {
        cart: data.getUser.cart,
        orders: data.getUser.orders,
        tradeIns: data.getUser.tradeIns,
        shipping: data.getUser.shipping,
      })
    };
  }, [session, userProfile, data, refreshTrigger]);

  console.log("🔍 DEBUGGING USER DATA:");
  console.log("Combined user object:", combinedUser);
  console.log("User isAdmin:", combinedUser?.isAdmin);
  console.log("User adminRights:", combinedUser?.adminRights);
  console.log("User profile data:", userProfile);
  console.log("User profile isAdmin:", userProfile?.isAdmin);
  console.log("User profile adminRights:", userProfile?.adminRights);
  console.log("Session user:", session?.user);
  console.log("Refresh trigger:", refreshTrigger);

  // Combined loading state
  const isLoading = loading || profileLoading || (session?.user?.email && fetching);

  const refreshApp = async () => {
    console.log('🔄 Aggressively refreshing app data...');
    
    // Force clear any cached data first
    setUserProfile(null);
    setRefreshTrigger(prev => prev + 1);
    
    // Refresh the user profile from Supabase with cache busting
    if (session?.user) {
      setProfileLoading(true);
      try {
        // Add cache busting and force fresh data
        const timestamp = Date.now();
        console.log(`🔄 Force refreshing user data at ${timestamp}`);
        
        // PRIORITIZE EMAIL-BASED LOOKUP for refresh as well
        console.log('🔄 Refreshing user data by EMAIL (primary method):', session.user.email);
        const { data: emailData, error: emailError } = await supabaseBrowser
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (emailError) {
          console.log('❌ Error refreshing by email, trying by ID...', emailError);
          
          // Try by ID as fallback
          const { data, error } = await supabaseBrowser
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('❌ Error refreshing user profile by ID:', error);
          } else {
            console.log('✅ User profile refreshed by ID (fallback):', data);
            console.log('✅ Admin status from fresh data:', data.isAdmin);
            console.log('✅ Admin rights from fresh data:', data.adminRights);
            console.log('✅ Phone number from fresh data:', data.phoneNumber);
            
            setUserProfile(data);
            // Force multiple re-renders to ensure UI updates
            setRefreshTrigger(prev => prev + 2);
            
            // Additional delay to ensure state updates propagate
            setTimeout(() => {
              setRefreshTrigger(prev => prev + 1);
            }, 100);
          }
        } else {
          console.log('✅ User profile refreshed by EMAIL (primary):', emailData);
          console.log('✅ Admin status from fresh data:', emailData.isAdmin);
          console.log('✅ Admin rights from fresh data:', emailData.adminRights);
          console.log('✅ Phone number from fresh data:', emailData.phoneNumber);
          
          setUserProfile(emailData);
          // Force multiple re-renders to ensure UI updates
          setRefreshTrigger(prev => prev + 2);
          
          // Additional delay to ensure state updates propagate
          setTimeout(() => {
            setRefreshTrigger(prev => prev + 1);
          }, 100);
        }
      } catch (err) {
        console.error('❌ Error refreshing profile:', err);
      } finally {
        setProfileLoading(false);
      }
    }
    
    // Also refresh GraphQL data if needed
    reexecuteQuery();
    
    console.log('✅ Refresh completed - UI should update now');
  };

  // Global refresh function that can be called from anywhere
  const forceRefreshUser = async () => {
    console.log('🚀 Force refreshing user data globally...');
    await refreshApp();
    
    // Additional force refresh after a short delay
    setTimeout(async () => {
      console.log('🚀 Secondary force refresh...');
      await refreshApp();
    }, 500);
  };

  return (
    <UserContext.Provider
      value={{ 
        refreshApp, 
        forceRefreshUser,
        user: combinedUser,
        session,
        loading: isLoading 
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);

export default UserProvider;
