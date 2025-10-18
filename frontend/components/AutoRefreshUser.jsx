import { useUser } from "@/context/User";
import { useEffect, useRef } from "react";

/**
 * AutoRefreshUser component that automatically refreshes user data
 * when certain conditions are met to prevent caching issues
 */
export default function AutoRefreshUser() {
  const { user, forceRefreshUser } = useUser();
  const lastRefreshTime = useRef(0);
  const refreshInterval = useRef(null);

  useEffect(() => {
    // Auto-refresh user data every 30 seconds to prevent stale data
    refreshInterval.current = setInterval(async () => {
      const now = Date.now();
      // Only refresh if it's been more than 30 seconds since last refresh
      if (now - lastRefreshTime.current > 30000) {
        console.log('🔄 Auto-refreshing user data to prevent stale cache...');
        await forceRefreshUser();
        lastRefreshTime.current = now;
      }
    }, 30000); // Check every 30 seconds

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [forceRefreshUser]);

  // Refresh when user data changes (e.g., after login)
  useEffect(() => {
    if (user) {
      console.log('👤 User data changed, ensuring fresh data...');
      const now = Date.now();
      // Only refresh if it's been more than 5 seconds since last refresh
      if (now - lastRefreshTime.current > 5000) {
        forceRefreshUser();
        lastRefreshTime.current = now;
      }
    }
  }, [user?.id, user?.email, forceRefreshUser]);

  // This component doesn't render anything
  return null;
}


