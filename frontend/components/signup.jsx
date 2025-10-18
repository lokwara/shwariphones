import { Button, Card } from "@mantine/core";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import React from "react";

function SignUp() {
  return (
    <div className="w-full justify-center">
      <br />
      <br />
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <div className="my-4">
          <h1 className="text-[1.4rem] font-semibold">
            Looks like you are&apos;t logged in
          </h1>

          <br />
          <Button
            size="lg"
            fullWidth
            color="white"
            shadow="md"
            onClick={() => supabaseBrowser.auth.signInWithOAuth({ provider: 'google' })}
            radius={32}
            leftSection={<img src={"/google.svg"} />}
            className="shadow-2xl  text-black">
            <p className="font-medium text-black">Sign up with Google</p>
          </Button>
        </div>
      </Card>
      <br />
      <br />
    </div>
  );
}

export default SignUp;
