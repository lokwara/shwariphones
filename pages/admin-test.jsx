import { useUser } from "@/context/User";
import { Button, Card, Text } from "@mantine/core";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

export default function AdminTest() {
  const { user, loading, refreshApp, forceRefreshUser } = useUser();
  const router = useRouter();

  useEffect(() => {
    console.log("Admin Test - User object:", user);
    console.log("Admin Test - isAdmin:", user?.isAdmin);
    console.log("Admin Test - adminRights:", user?.adminRights);
    console.log("Admin Test - Loading:", loading);
  }, [user, loading]);

  const handleRefresh = async () => {
    console.log("Manually refreshing user data...");
    await refreshApp();
    console.log("Refresh completed");
  };

  const handleForceRefresh = async () => {
    console.log("🚀 Force refreshing user data...");
    await forceRefreshUser();
    console.log("Force refresh completed");
  };

  const goToAdmin = () => {
    router.push("/administration");
  };

  if (loading) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <Text size="xl" weight="bold" className="mb-4">
          Admin Status Test
        </Text>
        
        <div className="space-y-4">
          <div>
            <Text weight="bold">User Email:</Text>
            <Text>{user?.email || "Not loaded"}</Text>
          </div>
          
          <div>
            <Text weight="bold">Is Admin:</Text>
            <Text color={user?.isAdmin ? "green" : "red"}>
              {user?.isAdmin ? "✅ YES" : "❌ NO"}
            </Text>
          </div>
          
          <div>
            <Text weight="bold">Admin Rights:</Text>
            <Text>{JSON.stringify(user?.adminRights) || "None"}</Text>
          </div>
          
          <div>
            <Text weight="bold">User ID:</Text>
            <Text>{user?.id || "Not loaded"}</Text>
          </div>
          
          <div className="flex gap-4 mt-6">
            <Button onClick={handleRefresh} color="blue">
              Refresh User Data
            </Button>
            
            <Button onClick={handleForceRefresh} color="orange">
              🚀 Force Refresh
            </Button>
            
            {user?.isAdmin && (
              <Button onClick={goToAdmin} color="green">
                Go to Administration
              </Button>
            )}
          </div>
          
          {!user?.isAdmin && (
            <Text color="red" size="sm" className="mt-4">
              ⚠️ You are not an admin. Please contact support or refresh the page.
            </Text>
          )}
        </div>
      </Card>
    </div>
  );
}
