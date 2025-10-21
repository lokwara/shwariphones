import { useUser } from "@/context/User";
import { Button, Card, Text, Code } from "@mantine/core";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

export default function DebugUser() {
  const { user, loading, refreshApp, forceRefreshUser, userProfile, session } = useUser();
  const router = useRouter();
  const [debugLogs, setDebugLogs] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog("Component mounted");
    addLog(`User object: ${JSON.stringify(user, null, 2)}`);
    addLog(`UserProfile: ${JSON.stringify(userProfile, null, 2)}`);
    addLog(`Session: ${JSON.stringify(session, null, 2)}`);
  }, [user, userProfile, session]);

  const handleRefresh = async () => {
    addLog("🔄 Starting refresh...");
    await refreshApp();
    addLog("✅ Refresh completed");
  };

  const handleForceRefresh = async () => {
    addLog("🚀 Starting force refresh...");
    await forceRefreshUser();
    addLog("✅ Force refresh completed");
  };

  const goToAdmin = () => {
    router.push("/administration");
  };

  const goToAdminTest = () => {
    router.push("/admin-test");
  };

  if (loading) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="p-8">
      <Card className="max-w-4xl mx-auto">
        <Text size="xl" weight="bold" className="mb-4">
          🔍 User Data Debug Console
        </Text>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Text weight="bold">User Object:</Text>
              <Code block className="text-xs">
                {JSON.stringify(user, null, 2)}
              </Code>
            </div>
            
            <div>
              <Text weight="bold">User Profile:</Text>
              <Code block className="text-xs">
                {JSON.stringify(userProfile, null, 2)}
              </Code>
            </div>
            
            <div>
              <Text weight="bold">Session:</Text>
              <Code block className="text-xs">
                {JSON.stringify(session, null, 2)}
              </Code>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Text weight="bold">Key Values:</Text>
              <div className="space-y-2">
                <div>
                  <Text size="sm">Email: <Text span color="blue">{user?.email || "Not loaded"}</Text></Text>
                </div>
                <div>
                  <Text size="sm">Is Admin: <Text span color={user?.isAdmin ? "green" : "red"}>{user?.isAdmin ? "✅ YES" : "❌ NO"}</Text></Text>
                </div>
                <div>
                  <Text size="sm">Admin Rights: <Text span color="blue">{JSON.stringify(user?.adminRights)}</Text></Text>
                </div>
                <div>
                  <Text size="sm">User ID: <Text span color="blue">{user?.id || "Not loaded"}</Text></Text>
                </div>
                <div>
                  <Text size="sm">Loading: <Text span color="orange">{loading ? "Yes" : "No"}</Text></Text>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button onClick={handleRefresh} color="blue" size="sm">
                🔄 Refresh User Data
              </Button>
              
              <Button onClick={handleForceRefresh} color="orange" size="sm">
                🚀 Force Refresh
              </Button>
              
              {user?.isAdmin && (
                <Button onClick={goToAdmin} color="green" size="sm">
                  🎯 Go to Administration
                </Button>
              )}
              
              <Button onClick={goToAdminTest} color="purple" size="sm">
                🧪 Go to Admin Test
              </Button>
            </div>
            
            {!user?.isAdmin && (
              <Text color="red" size="sm">
                ⚠️ You are not an admin. Check the debug logs below.
              </Text>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <Text weight="bold" className="mb-2">Debug Logs:</Text>
          <div className="bg-gray-100 p-4 rounded max-h-64 overflow-y-auto">
            {debugLogs.map((log, index) => (
              <div key={index} className="text-xs font-mono mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}



