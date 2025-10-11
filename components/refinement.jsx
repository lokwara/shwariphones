// import { Checkbox } from "@mantine/core"
// import { useRouter } from "next/router"
// import React, { useEffect } from "react"
// import { useRefinementList } from "react-instantsearch"

// function Refinement({ attribute }) {
//   const { items, refine } = useRefinementList({
//     attribute,
//     operator: "or",
//     limit: 100,
//     showMore: true,
//   })
//   const router = useRouter()

//   // Read selected values for the given attribute from query string
//   const selectedFromQuery = router.query[attribute]

//   const selected = Array.isArray(selectedFromQuery)
//     ? selectedFromQuery
//     : selectedFromQuery
//     ? [selectedFromQuery]
//     : []

//   // Refine on mount or query change
//   useEffect(() => {
//     items.forEach((item) => {
//       const shouldBeRefined = selected.includes(item.value)
//       if (shouldBeRefined !== item.isRefined) {
//         refine(item.value)
//       }
//     })
//   }, [selected.join(","), items.map((i) => i.value).join(",")])

//   const handleChange = (value) => {
//     const isSelected = selected.includes(value)
//     const newSelected = isSelected
//       ? selected.filter((v) => v !== value)
//       : [...selected, value]

//     // Apply refinement
//     refine(value)

//     // Update query params
//     const newQuery = { ...router.query }
//     if (newSelected.length > 0) {
//       newQuery[attribute] = newSelected
//     } else {
//       delete newQuery[attribute]
//     }

//     router.push(
//       {
//         pathname: router.pathname,
//         query: newQuery,
//       },
//       undefined,
//       { shallow: true }
//     )
//   }

//   return (
//     <div className="space-y-2">
//       {items.map((item) => (
//         <label key={item.value} className="flex items-center space-x-2">
//           <Checkbox
//             checked={item.isRefined}
//             onChange={() => handleChange(item.value)}
//           />
//           <span>
//             {item.label} ({item.count})
//           </span>
//         </label>
//       ))}
//     </div>
//   )
// }

// export default Refinement

import { Checkbox } from "@mantine/core"
import { useRouter } from "next/router"
import React, { useEffect } from "react"
import { useRefinementList } from "react-instantsearch"

function Refinement({ attribute }) {
  const router = useRouter()

  const { items, refine } = useRefinementList({
    attribute,
    operator: "or",
    showMore: true,
  })

  const selectedFromQuery = router.query[attribute]
  const selected = Array.isArray(selectedFromQuery)
    ? selectedFromQuery
    : selectedFromQuery
    ? [selectedFromQuery]
    : []

  // 🔄 Apply selected filters from query string on mount/update
  useEffect(() => {
    const valuesToRefine = new Set(selected)
    const currentRefinements = new Set(
      items.filter((i) => i.isRefined).map((i) => i.value)
    )

    // Refine all selected from URL if not yet refined
    selected.forEach((val) => {
      if (!currentRefinements.has(val)) {
        refine(val)
      }
    })

    // Unrefine unchecked values
    items.forEach((item) => {
      const shouldBeRefined = valuesToRefine.has(item.value)
      if (item.isRefined && !shouldBeRefined) {
        refine(item.value)
      }
    })
  }, [
    selected.join(","),
    items.map((i) => `${i.value}:${i.isRefined}`).join(","),
  ])

  const handleChange = (value) => {
    const isSelected = selected.includes(value)
    const newSelected = isSelected
      ? selected.filter((v) => v !== value)
      : [...selected, value]

    refine(value) // toggle refinement in search

    const newQuery = { ...router.query }
    if (newSelected.length > 0) {
      newQuery[attribute] = newSelected
    } else {
      delete newQuery[attribute]
    }

    router.push(
      {
        pathname: router.pathname,
        query: newQuery,
      },
      undefined,
      { shallow: true }
    )
  }

  const allSelectedInItems = new Set(items.map((i) => i.value))

  return (
    <div className="space-y-2">
      {/* Render refinements from Algolia */}
      {items.map((item) => (
        <label key={item.value} className="flex items-center space-x-2">
          <Checkbox
            checked={item.isRefined}
            onChange={() => handleChange(item.value)}
          />
          <span>
            {item.label} ({item.count})
          </span>
        </label>
      ))}

      {/* 🔥 Show selected filters that aren't in the list */}
      {selected
        .filter((val) => !allSelectedInItems.has(val))
        .map((val) => (
          <label key={val} className="flex items-center space-x-2">
            <Checkbox checked={true} onChange={() => handleChange(val)} />
            <span>{val} (0)</span>
          </label>
        ))}
    </div>
  )
}

export default Refinement
