import { Tabs } from "@mantine/core";
import React from "react";
import Admins from "./Admins";
import Customers from "./Customers";

function UsersAccess() {
  return (
    <div className="bg-slate-100 p-8 w-full h-screen">
      <h1 className="text-xl font-bold">Users & Access</h1>
      <br />

      <div className="flex justify-between space-x-8">
        <div className="w-1/2">
          <Admins />
        </div>

        <div className="w-1/2">
          <Customers />
        </div>
      </div>
      {/* <Tabs defaultValue="admins">
        <Tabs.List>
          <Tabs.Tab value="admins">Admins</Tabs.Tab>
          <Tabs.Tab value="customers">Customers</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="admins" pt="xs"></Tabs.Panel>

        <Tabs.Panel value="customers" pt="xs">
          <Customers />
        </Tabs.Panel>
      </Tabs> */}
    </div>
  );
}

export default UsersAccess;
