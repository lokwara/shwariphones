import { Tabs } from "@mantine/core";
import React from "react";
import Sales from "./Sales";
import Orders from "./Orders";
import Analytics from "./Analytics";
import Requests from "./requests";

function SalesAndAnalytics() {
  return (
    <div className="bg-slate-100 p-8 w-full h-screen">
      <h1 className="text-xl font-bold">Sales & Analytics</h1>
      <br />
      <Tabs defaultValue="sales">
        <Tabs.List>
          <Tabs.Tab value="sales">Sales</Tabs.Tab>
          <Tabs.Tab value="analytics">Analytics</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="sales" pt="xs">
          <Sales />
        </Tabs.Panel>

        <Tabs.Panel value="analytics" pt="xs">
          <Analytics />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

export default SalesAndAnalytics;
