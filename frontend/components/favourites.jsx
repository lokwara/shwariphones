import { Button, Image } from "@mantine/core";
import React from "react";
import { ProductCard } from ".";

function Favourites() {
  const favourites = 0;

  if (favourites?.length > 0) {
    return (
      <div className="py-8">
        <p className="text-gray-600">1 item</p>
        <br />

        <div className="space-y-8">
          {favourites.map((favourite, i) => (
            <ProductCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="bg-white rounded-lg p-8">
        <h1 className="text-[1.3rem] font-semibold">
          Nothing to see here... yet
        </h1>
        <br />
        <p className="text-gray-600">
          Keep tabs on your favorite devices by saving them here.
        </p>
        <br />
        <Image src="/no-order.svg"></Image>
        <br />
        <Button size="lg" fullWidth onClick={() => router.push("/")}>
          Find your faves
        </Button>
      </div>
    </div>
  );
}

export default Favourites;
