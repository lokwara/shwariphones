import { useQuery } from "urql"
import { useState } from "react"
import { useDebounce } from "use-debounce"

const REDIS_VARIANT_QUERY = `
  query SearchVariants($q: String) {
    searchVariants(q: $q) {
      id
      brand
      model
      deviceType
    }
  }
`

export default function RedisVariantSearch() {
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 400)

  const [{ data, fetching, error }] = useQuery({
    query: REDIS_VARIANT_QUERY,
    variables: { q: debouncedSearch || null },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Search Device Variants</h1>

      <input
        type="text"
        placeholder="Search brand, model, or type..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md mb-6"
      />

      {fetching && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Error: {error.message}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.searchVariants?.length ? (
          data.searchVariants.map((variant) => (
            <div
              key={variant._id}
              className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <h2 className="font-semibold text-lg">
                {variant.brand} {variant.model}
              </h2>
              <p className="text-gray-500">{variant.deviceType}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full">
            {debouncedSearch ? "No variants found." : "Start typing to search."}
          </p>
        )}
      </div>
    </div>
  )
}
