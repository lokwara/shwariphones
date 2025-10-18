import { Image } from "@mantine/core"
import { useRouter } from "next/router"
import React from "react"
import { Highlight } from "react-instantsearch"

function SearchCard({ hit }) {
  const router = useRouter()

  const getCurrentPrice = (device) => {
    if (
      device?.offer &&
      new Date(parseInt(device?.offer?.info?.start)).getTime() <
        new Date().getTime() &&
      new Date(parseInt(device?.offer?.info?.end)).getTime() >
        new Date().getTime()
    ) {
      if (device?.offer?.reduction == "by_price") {
        return device?.price - device?.offer?.value
      } else if (device?.offer?.reduction == "by_percentage") {
        return (device?.price * (100 - device?.offer?.value)) / 100
      }
    } else {
      return device?.price
    }
  }

  const getSlashedPrice = (device) => {
    if (
      device?.offer &&
      new Date(parseInt(device.offer?.info?.start)).getTime() <
        new Date().getTime() &&
      new Date(parseInt(device.offer?.info?.end)).getTime() >
        new Date().getTime()
    ) {
      return device?.price
    } else {
      return null
    }
  }

  return (
    <div
      className="bg-white p-4 min-w-[220px] space-y-4 grid grid-cols-7 my-4 items-center gap-x-4"
      onClick={() => router.push(`/product/${hit?.id}`)}
    >
      <Image className="w-[50px] col-span-2" src={hit?.images[0]} />
      <div className="col-span-5 space-y-1">
        <div className="flex">
          <Highlight
            attribute="variant.model"
            hit={hit}
            className="font-bold"
          />
          -
          <Highlight attribute="storage" hit={hit} className="font-bold" />-
          <Highlight attribute="color" hit={hit} className="font-bold" />
        </div>
        {/* <Highlight attribute="searchTerm" hit={hit} className="font-bold" /> */}

        <p className="text-gray-500 text-[0.8rem]">{hit?.description}</p>

        <div>
          <p className="text-[0.7rem] font-duplet text-gray-500">Starting at</p>
          <p className="font-semibold">
            {" "}
            Ksh. {getCurrentPrice(hit)?.toLocaleString("en-US")}
          </p>
          {getSlashedPrice() && (
            <p className="line-through text-[0.8rem] text-gray-500">
              {" "}
              Ksh. {getSlashedPrice(hit)?.toLocaleString("en-US")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchCard
