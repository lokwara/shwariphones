import React, { useCallback } from "react"
import { useHierarchicalMenu } from "react-instantsearch"

function HierarchialMenu() {
  //   const transformItems = useCallback((items) => {

  //     return items.map((item) => ({
  //       ...item,
  //       label: item.label.toUpperCase(),
  //     }));
  //   }, []);

  const {
    items,
    refine,
    canToggleShowMore,
    toggleShowMore,
    isShowingMore,
    createURL,
  } = useHierarchicalMenu({
    attributes: ["color", "price", "storage", "variant.brand", "variant.model"],
    separator: " - ",
    rootPath: "Test",
    showParentLevel: false,
    limit: 5,
    showMore: true,
    showMoreLimit: 30,
    sortBy: ["count", "name:asc"],
    // transformItems,
  })

  return (
    <>
      <HierarchicalList
        items={items}
        onNavigate={refine}
        createURL={createURL}
      />

      <button disabled={!canToggleShowMore} onClick={toggleShowMore}>
        {isShowingMore ? "Show less" : "Show more"}
      </button>
    </>
  )
}

function HierarchicalList({ items, createURL, onNavigate }) {
  if (items.length === 0) {
    return null
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item.value}>
          <a
            href={createURL(item.value)}
            onClick={(event) => {
              if (isModifierClick(event)) {
                return
              }
              event.preventDefault()

              onNavigate(item.value)
            }}
            style={{ fontWeight: item.isRefined ? "bold" : "normal" }}
          >
            <span>{item.label}</span>
            <span>{item.count}</span>
          </a>

          {item.data && (
            <HierarchicalList
              items={item.data}
              onNavigate={onNavigate}
              createURL={createURL}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

function isModifierClick(event) {
  const isMiddleClick = event.button === 1
  return Boolean(
    isMiddleClick ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
  )
}

export default HierarchialMenu
