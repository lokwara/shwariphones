import { Avatar, Menu, UnstyledButton, rem } from "@mantine/core";
import { IconArrowLeft, IconLogout, IconSettings } from "@tabler/icons-react";
import { useRouter } from "next/router";
import React from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function AdminHeader({ current }) {
  const router = useRouter();
  return (
    <div
      className={`sticky z-30 top-0 p-5 ${
        current ? "bg-white" : "bg-blue-50"
      } `}>
      <div className={`flex justify-end `}>
        <Menu shadow="md">
          <Menu.Target>
            <UnstyledButton>
              <Avatar color="red" size={36}>
                SK
              </Avatar>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconSettings />}>
              Profile & Settings
            </Menu.Item>
            <Menu.Item 
              color="red" 
              leftSection={<IconLogout />}
              onClick={() => supabaseBrowser.auth.signOut()}
            >
              Sign out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
      {current && (
        <div className="flex space-x-8">
          <UnstyledButton onClick={() => router.push("/admin")}>
            <IconArrowLeft />
          </UnstyledButton>
          <h1 className="text-center text-[1.3rem] font-semibold">{current}</h1>
        </div>
      )}
    </div>
  );
}

export default AdminHeader;
