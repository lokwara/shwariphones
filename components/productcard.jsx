import Image from "next/image"
import { useRouter } from "next/router"
import React from "react"

function ProductCard({ variant, customStyles, bestSeller }) {
  const router = useRouter()

  const formatPriceRange = (items) => {
    if (!items || items.length === 0) return ""

    const prices = items.map((item) => item?.price).sort((a, b) => a - b)

    if (prices.length === 1) {
      return `Ksh. ${prices[0].toLocaleString()}`
    }

    const minPrice = prices[0]
    const maxPrice = prices[prices.length - 1]

    return `Ksh. ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`
  }

  const getStorages = (items) => {
    const sortedItems = [...items].sort((a, b) => a.price - b.price)
    const labels = sortedItems.map((item) => item.label).join(", ")
    return labels
  }

  return (
    <div
      className={
        `hover:cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-200 bg-white p-4 min-w-[220px] space-y-4 relative ` +
        customStyles
      }
      onClick={() => router.push(`/product/${variant?.id}`)}
    >
      {bestSeller && (
        <div className="bg-gray-300 rounded-md py-1 px-2  absolute  top-1 left-1">
          <p className="text-[0.7rem]  text-gray-600">Bestseller</p>
        </div>
      )}

      <img
        className="object-contain h-[120px] w-auto mx-auto"
        src={variant?.colors[0]?.images[variant?.colors[0]?.primaryIndex || 0]}
      />

      <div>
        <p className="font-semibold text-[1rem] max-w-[190px] ">
          {variant?.model}
        </p>

        <p className="text-gray-500 text-[0.8rem]">
          {getStorages(variant?.storages)}
        </p>

        {/* 
          {device?.storage} - {device?.color}
        </p> */}
        {/* <p className="text-gray-500 text-[0.8rem]">{device?.description}</p> */}
      </div>
      <div className="space-y-1">
        <p className="text-[0.7rem] font-duplet text-gray-500">Starting at</p>
        <p className="font-semibold">
          {" "}
          {/* Ksh. {getCurrentPrice()?.toLocaleString("en-US")} */}
          {formatPriceRange(variant?.storages)}
        </p>
        {/* {getSlashedPrice() && (
          <p className="line-through text-[0.8rem] text-gray-500">
            {" "}
            Ksh. {getSlashedPrice()?.toLocaleString("en-US")}
          </p>
        )} */}
      </div>
    </div>
  )
}

export default ProductCard
