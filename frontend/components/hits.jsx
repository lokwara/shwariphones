import React, { useCallback, useEffect } from "react"
import { useInfiniteHits } from "react-instantsearch"
import { ProductCard } from "."

function CustomInfiniteHits() {
  const {
    items,
    currentPageHits,
    results,
    banner,
    isFirstPage,
    isLastPage,
    showPrevious,
    showMore,
    sendEvent,
  } = useInfiniteHits()

  useEffect(() => {
    if (!isLastPage && typeof showMore === "function") {
      showMore()
    }
  }, [isLastPage, showMore])

  return (
    <>
      {items.map((hit) => (
        <div key={hit.objectID} className="col-span-1">
          <ProductCard variant={hit} />
        </div>
      ))}
    </>
  )
}

export default CustomInfiniteHits
