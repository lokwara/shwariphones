import { Tabs } from "@mantine/core";
import React from "react";

import Devices from "./Devices";

function Inventory() {
  return (
    <div className="bg-slate-100 p-8 w-full h-screen">
      <h1 className="text-xl font-bold">Inventory</h1>
      <br />

      <Devices />
    </div>
  );
}

export default Inventory;
