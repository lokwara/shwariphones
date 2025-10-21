import Image from "next/image";
import { useRouter } from "next/router";
import React from "react";

function ProductCardOffer({ device, customStyles }) {
  const router = useRouter();

  return (
    <div
      className={
        `bg-white p-4 min-w-[220px] max-w-[220px] space-y-4 relative ` +
        customStyles
      }
      onClick={() =>
        device?.status == "Available"
          ? router.push(`/offer/${device?.id}`)
          : null
      }
    >
      {device?.status == "Sold" && (
        <div className="w-full bg-red-500 absolute top-0 left-0 rounded-t-md p-1">
          <p className="w-full text-center text-white font-medium">SOLD</p>
        </div>
      )}
      <img
        className="object-contain h-[120px] w-auto mx-auto"
        src={device?.color?.images[device?.color?.primaryIndex || 0]}
      />

      <div>
        <p className="font-semibold text-[1rem]">{device?.variant?.model}</p>

        <p className="text-gray-500 text-[0.8rem]">
          {device?.storage?.label} - {device?.color?.label}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-[0.7rem] font-duplet text-gray-500">Going at</p>
        <p className="font-semibold">
          Ksh. {device?.offer?.price?.toLocaleString("en-US")}
        </p>

        <p className="line-through text-[0.8rem] text-gray-500">
          Ksh. {device?.storage?.price?.toLocaleString("en-US")}
        </p>
      </div>
    </div>
  );
}

export default ProductCardOffer;
