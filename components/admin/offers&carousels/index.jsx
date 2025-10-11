import { Tabs } from "@mantine/core";
import React from "react";
import Offers from "./Offers";
import Carousels from "./Carousels";

function OffersCarousels() {
  return (
    <div className="bg-slate-100 p-8 w-full h-screen">
      <h1 className="text-xl font-bold">Offers & Carousel</h1>
      <br />
      <Tabs defaultValue="offers">
        <Tabs.List>
          <Tabs.Tab value="offers">Offers</Tabs.Tab>
          <Tabs.Tab value="carousels">Carousels</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="offers" pt="xs">
          <Offers />
        </Tabs.Panel>

        <Tabs.Panel value="carousels" pt="xs">
          <Carousels />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

export default OffersCarousels;
