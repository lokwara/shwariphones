import { Footer, Header, ProductCard, SearchCard } from "@/components"
import {
  Button,
  Checkbox,
  Divider,
  Drawer,
  Group,
  Menu,
  Pill,
  Stack,
  TextInput,
} from "@mantine/core"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { useRouter } from "next/router"
import React, { useEffect, useMemo, useRef, useState } from "react"

import CustomInfiniteHits from "@/components/hits"
import Refinement from "@/components/refinement"
import PriceFilter from "@/components/pricefilter"
import { useViewportSize } from "@mantine/hooks"
import CustomCurrentRefinements from "@/components/currentrefinements"
import { useQuery } from "urql"
import { GET_VARIANTS } from "@/lib/request"

export function NoResultsWrapper({ children }) {
  const { items } = useHits()

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No items currently match your filters
      </div>
    )
  }

  return <>{children}</>
}

function All() {
  const [keyword, setKeyword] = useState("")

  const [deviceTypes, setDeviceTypes] = useState([])
  const [brands, setBrands] = useState([])
  const [colors, setColors] = useState([])
  const [storages, setStorages] = useState([])
  const [prices, setPrices] = useState([])

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_VARIANTS,
  })

  const { width } = useViewportSize()
  const router = useRouter()
  const [moveUp, setMoveUp] = useState(false)

  useEffect(() => {
    const query = {
      ...(brands.length ? { brand: brands } : {}),
      ...(deviceTypes.length ? { deviceType: deviceTypes } : {}),
    }

    router.replace(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true }
    )
  }, [brands, deviceTypes])

  useEffect(() => {
    const brand = router.query.brand
    const deviceType = router.query.deviceType

    if (brand) {
      setBrands(Array.isArray(brand) ? brand : [brand])
    } else {
      setBrands([])
    }

    if (deviceType) {
      setDeviceTypes(Array.isArray(deviceType) ? deviceType : [deviceType])
    } else {
      setDeviceTypes([])
    }
  }, [router.query.brand, router.query.deviceType])

  const filteredVariants = useMemo(() => {
    if (!data?.getVariants) return []

    return data.getVariants.filter((variant) => {
      const matchesDeviceType =
        deviceTypes?.length === 0 || deviceTypes?.includes(variant?.deviceType)

      const matchesKeyword =
        !keyword ||
        variant?.brand?.toLowerCase()?.includes(keyword?.toLowerCase()) ||
        variant?.model?.toLowerCase()?.includes(keyword?.toLowerCase())

      const matchesBrand =
        brands?.length === 0 || brands?.includes(variant?.brand)

      const matchesColor =
        colors.length === 0 ||
        variant.colors?.some((color) => colors.includes(color.label))

      const matchesStorage =
        storages.length === 0 ||
        variant.storages?.some((storage) => storages.includes(storage.label))

      const matchesPrice =
        prices.length === 0 ||
        prices.includes("all") ||
        variant.storages?.some((storage) =>
          prices.some((range) => {
            const price = storage.price
            if (range === "0-25") return price < 25000
            if (range === "25-50") return price >= 25000 && price <= 50000
            if (range === "50-75") return price > 50000 && price <= 75000
            if (range === "75+") return price > 75000
            return false
          })
        )

      return (
        matchesDeviceType &&
        matchesKeyword &&
        matchesBrand &&
        matchesColor &&
        matchesStorage &&
        matchesPrice
      )
    })
  }, [
    data?.getVariants,
    deviceTypes,
    keyword,
    brands,
    colors,
    storages,
    prices,
  ])

  return (
    <div className="bg-slate-100">
      <Header />
      <br />

      <div className="px-8 space-y-3">
        <TextInput
          className="w-full"
          placeholder="Search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <div className="flex flex-wrap">{/* <CurrentRefinements /> */}</div>

        <div className="lg:grid lg:gap-8 lg:grid-cols-5 flex flex-col-reverse">
          <div className=" no-scrollbar col-span-4 lg:grid grid-cols-4 gap-5 overflow-y-auto space-y-2 lg:max-h-[calc(100vh-160px)]">
            {filteredVariants?.map((variant) => (
              <div key={variant?.id} className="col-span-1">
                <ProductCard key={variant?.id} variant={variant} />
              </div>
            ))}
          </div>

          {width > 750 && (
            <div className="col-span-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-160px)]">
              <strong>Product</strong>
              <br />
              <Checkbox.Group value={deviceTypes} onChange={setDeviceTypes}>
                <Stack mt="xs">
                  {[
                    ...new Set(
                      data?.getVariants?.map(({ deviceType }) => deviceType)
                    ),
                  ].map((product) => (
                    <Checkbox key={product} value={product} label={product} />
                  ))}
                </Stack>
              </Checkbox.Group>

              <br />
              <strong>Brand</strong>
              <br />
              <Checkbox.Group value={brands} onChange={setBrands}>
                <Stack mt="xs">
                  {[
                    ...new Set(data?.getVariants?.map(({ brand }) => brand)),
                  ].map((brand) => (
                    <Checkbox key={brand} value={brand} label={brand} />
                  ))}
                </Stack>
              </Checkbox.Group>

              <br />
              <strong>Price</strong>
              <br />
              <Checkbox.Group value={prices} onChange={setPrices}>
                <Stack mt="xs">
                  <Checkbox value="0-25" label="Less than Ksh. 25,000" />
                  <Checkbox value="25-50" label="Ksh. 25,000 - Ksh. 50,000" />
                  <Checkbox value="50-75" label="Ksh. 50,000 - Ksh. 75,000" />
                  <Checkbox value="75+" label="More than Ksh. 75,000" />
                </Stack>
              </Checkbox.Group>
              <br />
              <strong>Storage / Label</strong>

              <br />
              <Checkbox.Group value={storages} onChange={setStorages}>
                <Stack mt="xs">
                  {Array.from(
                    new Set(
                      data?.getVariants?.flatMap((v) =>
                        v.storages.map((s) => s.label)
                      )
                    )
                  ).map((storage) => (
                    <Checkbox key={storage} value={storage} label={storage} />
                  ))}
                </Stack>
              </Checkbox.Group>
              <br />

              <strong>Color</strong>
              <br />
              <Checkbox.Group value={colors} onChange={setColors}>
                <Stack mt="xs">
                  {Array.from(
                    new Set(
                      data?.getVariants?.flatMap((v) =>
                        v.colors.map((s) => s.label)
                      )
                    )
                  ).map((color) => (
                    <Checkbox key={color} value={color} label={color} />
                  ))}
                </Stack>
              </Checkbox.Group>

              <br />
            </div>
          )}
        </div>
      </div>
      <br />

      {width < 750 && (
        <div
          className={`fixed bg-slate-200 bottom-0 w-full p-4 ${
            !moveUp && "translate-y-[430px]"
          } z-[99]`}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-bold text-[1.3rem]">Filters</h1>
            <Button variant="transparent" onClick={() => setMoveUp(!moveUp)}>
              {!moveUp ? <IconChevronUp /> : <IconChevronDown />}
            </Button>
          </div>

          <div className="max-h-[400px] h-[400px] overflow-y-auto  no-scrollbar">
            <br />
            <strong>Product</strong>
            <br />
            <Checkbox.Group value={deviceTypes} onChange={setDeviceTypes}>
              <Stack mt="xs">
                {[
                  ...new Set(
                    data?.getVariants?.map(({ deviceType }) => deviceType)
                  ),
                ].map((product) => (
                  <Checkbox key={product} value={product} label={product} />
                ))}
              </Stack>
            </Checkbox.Group>
            <br />
            <strong>Brand</strong>
            <br />
            <Checkbox.Group value={brands} onChange={setBrands}>
              <Stack mt="xs">
                {[...new Set(data?.getVariants?.map(({ brand }) => brand))].map(
                  (brand) => (
                    <Checkbox key={brand} value={brand} label={brand} />
                  )
                )}
              </Stack>
            </Checkbox.Group>

            <br />
            <strong>Price</strong>
            <br />
            <Checkbox.Group value={prices} onChange={setPrices}>
              <Stack mt="xs">
                <Checkbox value="0-25" label="Less than Ksh. 25,000" />
                <Checkbox value="25-50" label="Ksh. 25,000 - Ksh. 50,000" />
                <Checkbox value="50-75" label="Ksh. 50,000 - Ksh. 75,000" />
                <Checkbox value="75+" label="More than Ksh. 75,000" />
              </Stack>
            </Checkbox.Group>
            <br />

            <strong>Storage/ Label</strong>
            <br />
            <Checkbox.Group value={storages} onChange={setStorages}>
              <Stack mt="xs">
                {Array.from(
                  new Set(
                    data?.getVariants.flatMap((v) =>
                      v.storages.map((s) => s.label)
                    )
                  )
                ).map((storage) => (
                  <Checkbox key={storage} value={storage} label={storage} />
                ))}
              </Stack>
            </Checkbox.Group>
            <br />
            <strong>Color</strong>
            <Checkbox.Group value={colors} onChange={setColors}>
              <Stack mt="xs">
                {Array.from(
                  new Set(
                    data?.getVariants.flatMap((v) =>
                      v.colors.map((s) => s.label)
                    )
                  )
                ).map((color) => (
                  <Checkbox key={color} value={color} label={color} />
                ))}
              </Stack>
            </Checkbox.Group>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}

export default All
