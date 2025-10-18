import { useSupabaseSession } from "@/lib/supabaseBrowser";
import { Button, Card, Text } from "@mantine/core";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

export default function TestSession() {
  const { session, loading } = useSupabaseSession();
  const [authStatus, setAuthStatus] = useState("Checking...");
  const router = useRouter();

  useEffect(() => {
    console.log("🔍 SESSION TEST:");
    console.log("Session:", session);
    console.log("Loading:", loading);
    console.log("User:", session?.user);
    console.log("Email:", session?.user?.email);
  }, [session, loading]);

  const handleSignIn = async () => {
    try {
      const { data, error } = await supabaseBrowser.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/test-session`
        }
      });
      
      if (error) {
        console.error('Sign in error:', error);
        setAuthStatus(`Error: ${error.message}`);
      } else {
        console.log('Sign in initiated:', data);
        setAuthStatus('Redirecting to Google...');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setAuthStatus(`Error: ${err.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabaseBrowser.auth.signOut();
      setAuthStatus('Signed out');
    } catch (err) {
      console.error('Sign out error:', err);
      setAuthStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-4">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="xl" weight="bold" mb="md">
          Supabase Session Test
        </Text>

        <div className="space-y-4">
          <div>
            <Text weight="bold">Loading:</Text>
            <Text color={loading ? "orange" : "green"}>
              {loading ? "Yes" : "No"}
            </Text>
          </div>

          <div>
            <Text weight="bold">Session Exists:</Text>
            <Text color={session ? "green" : "red"}>
              {session ? "Yes" : "No"}
            </Text>
          </div>

          <div>
            <Text weight="bold">User Exists:</Text>
            <Text color={session?.user ? "green" : "red"}>
              {session?.user ? "Yes" : "No"}
            </Text>
          </div>

          <div>
            <Text weight="bold">Email:</Text>
            <Text>{session?.user?.email || "Not available"}</Text>
          </div>

          <div>
            <Text weight="bold">User ID:</Text>
            <Text>{session?.user?.id || "Not available"}</Text>
          </div>

          <div>
            <Text weight="bold">Status:</Text>
            <Text>{authStatus}</Text>
          </div>

          <div className="flex gap-4">
            {!session ? (
              <Button onClick={handleSignIn} color="blue">
                Sign In with Google
              </Button>
            ) : (
              <Button onClick={handleSignOut} color="red">
                Sign Out
              </Button>
            )}
            
            <Button onClick={() => router.push('/debug-user')} color="green">
              Go to Debug Page
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
