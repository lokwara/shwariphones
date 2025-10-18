import {
  Avatar,
  Button,
  Indicator,
  Input,
  Loader,
  Menu,
  UnstyledButton,
} from "@mantine/core"
import {
  IconAdjustments,
  IconFilter,
  IconSearch,
  IconShoppingBag,
} from "@tabler/icons-react"
import { useRouter } from "next/router"
import React, { useCallback, useMemo } from "react"
import Image from "next/image"
import { Spotlight, spotlight } from "@mantine/spotlight"

import {
  SearchBox,
  Hits,
  Highlight,
  useInstantSearch,
  ClearRefinements,
} from "react-instantsearch"

import { useUser } from "@/context/User"
import { useViewportSize } from "@mantine/hooks"
import Link from "next/link"
import { useQuery } from "urql"
import { GET_VARIANTS } from "@/lib/request"
import { supabaseBrowser } from "@/lib/supabaseBrowser"
// import SuprSendInbox from "@suprsend/react-inbox";

const handleSignIn = async () => {
  await supabaseBrowser.auth.signInWithOAuth({ provider: 'google' });
};

const handleSignOut = async () => {
  await supabaseBrowser.auth.signOut();
};

function Header() {
  const router = useRouter()
  const { user, refreshApp } = useUser()

  const { width } = useViewportSize()

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_VARIANTS,
  })

  const changeBrand = useCallback((brand) => {
    router.push(`all?brand=${brand}`, undefined, { shallow: true })
  }, [])

  return (
    <div className="sticky bg-white z-30 top-0  border border-b-[1px] border-b-gray-400">
      <div className="px-8 py-4 justify-between flex bg-white items-center">
        <img
          src="/logo.webp"
          onClick={() => router.push("/")}
          className="h-[36px] lg:h-[48px]"
        />

        {width > 750 && (
          <div className=" flex space-x-8 items-center">
            <Link
              className="text-[0.8rem] font-bold hover:underline flex items-center space-x-2"
              href="/new-tradein"
            >
              <img src="/trade-in.svg" className="h-[12px]" />
              <span>Trade-in</span>
            </Link>
            <Menu trigger="hover" openDelay={100} shadow="md" width={200}>
              <Menu.Target>
                <p
                  onClick={() => changeBrand("Apple")}
                  className="text-[0.8rem] font-bold hover:cursor-pointer"
                >
                  iPhones
                </p>
              </Menu.Target>

              <Menu.Dropdown>
                <div className="max-h-[500px] overflow-auto no-scrollbar">
                  {data &&
                    data?.getVariants
                      ?.filter((variant) => variant?.brand == "Apple")
                      .map((variant) => (
                        <Menu.Item
                          key={variant?.id}
                          onClick={() => router.push(`/product/${variant?.id}`)}
                        >
                          {variant?.model}
                        </Menu.Item>
                      ))}
                </div>
              </Menu.Dropdown>
            </Menu>

            <Menu trigger="hover" openDelay={100} shadow="md" width={200}>
              <Menu.Target>
                <p
                  onClick={() => changeBrand("Samsung")}
                  className="text-[0.8rem] font-bold hover:cursor-pointer"
                >
                  Samsungs
                </p>
              </Menu.Target>

              <Menu.Dropdown>
                <div className="max-h-[500px] overflow-auto no-scrollbar">
                  {data &&
                    data?.getVariants
                      ?.filter((variant) => variant?.brand == "Samsung")
                      .map((variant) => (
                        <Menu.Item
                          key={variant?.id}
                          onClick={() => router.push(`/product/${variant?.id}`)}
                        >
                          {variant?.model}
                        </Menu.Item>
                      ))}
                </div>
              </Menu.Dropdown>
            </Menu>

            <Menu trigger="hover" openDelay={100} shadow="md" width={200}>
              <Menu.Target>
                <p
                  onClick={() => changeBrand("OnePlus")}
                  className="text-[0.8rem] font-bold hover:cursor-pointer"
                >
                  OnePlus
                </p>
              </Menu.Target>

              <Menu.Dropdown>
                <div className="max-h-[500px] overflow-auto no-scrollbar">
                  {data &&
                    data?.getVariants
                      ?.filter((variant) => variant?.brand == "OnePlus")
                      .map((variant) => (
                        <Menu.Item
                          key={variant?.id}
                          onClick={() => router.push(`/product/${variant?.id}`)}
                        >
                          {variant?.model}
                        </Menu.Item>
                      ))}
                </div>
              </Menu.Dropdown>
            </Menu>

            <Menu trigger="hover" openDelay={100} shadow="md" width={200}>
              <Menu.Target>
                <p
                  onClick={() => changeBrand("Google%20Pixel")}
                  className="text-[0.8rem] font-bold hover:cursor-pointer"
                >
                  Google Pixel
                </p>
              </Menu.Target>

              <Menu.Dropdown>
                <div className="max-h-[500px] overflow-auto no-scrollbar">
                  {data &&
                    data?.getVariants
                      ?.filter((variant) => variant?.brand == "Google Pixel")
                      .map((variant) => (
                        <Menu.Item
                          key={variant?.id}
                          onClick={() => router.push(`/product/${variant?.id}`)}
                        >
                          {variant?.model}
                        </Menu.Item>
                      ))}
                </div>
              </Menu.Dropdown>
            </Menu>

            <Menu trigger="hover" openDelay={100} shadow="md" width={200}>
              <Menu.Target>
                <p
                  onClick={() =>
                    router.push(
                      `all?deviceType=Apple+Watch&deviceType=Charger&deviceType=Airpods+%2F+Earphones`,
                      undefined,
                      {
                        shallow: true,
                      }
                    )
                  }
                  className="text-[0.8rem] font-bold hover:cursor-pointer"
                >
                  Accessories
                </p>
              </Menu.Target>

              <Menu.Dropdown>
                <div className="max-h-[500px] overflow-auto no-scrollbar">
                  {data &&
                    data?.getVariants
                      ?.filter(
                        (variant) =>
                          variant?.deviceType == "Apple Watch" ||
                          variant?.deviceType == "Airpods / Earphones" ||
                          variant?.deviceType == "Charger" ||
                          variant?.deviceType == "Phone case"
                      )
                      .map((variant) => (
                        <Menu.Item
                          key={variant?.id}
                          onClick={() => router.push(`/product/${variant?.id}`)}
                        >
                          {variant?.model}
                        </Menu.Item>
                      ))}
                </div>
              </Menu.Dropdown>
            </Menu>

            <Link
              className="text-[0.8rem] font-bold hover:underline"
              href="/#footer"
            >
              Find us
            </Link>
            <div
              onClick={spotlight.open}
              className="flex space-x-3 px-4 py-2 bg-gray-100 border rounded-md"
            >
              <IconSearch size={14} className="mt-1" color="gray" />
              <p className="text-gray-500">Search device</p>
            </div>
          </div>
        )}

        <div className="flex space-x-4 items-center">
          {user ? (
            <UnstyledButton onClick={() => router.push("/account")}>
              <Avatar src={user?.image} alt={user?.name} />
            </UnstyledButton>
          ) : (
            <Button variant="subtle" onClick={(handleSignIn)}>
              Sign in
            </Button>
          )}

          <UnstyledButton onClick={() => router.push("/cart")}>
            <Indicator size={16} label={user ? user?.cart?.length : 0}>
              <IconShoppingBag />
            </Indicator>
          </UnstyledButton>
        </div>
      </div>

      <div className="p-4 pt-0">
        {width < 750 && (
          <div
            onClick={spotlight.open}
            className="flex space-x-3 px-4 py-2 bg-gray-100 border rounded-md"
          >
            <IconSearch size={16} color="gray" />
            <p className="text-gray-500">Search</p>
          </div>
        )}

        <Spotlight.Root scrollable maxHeight={430}>
          <div className="p-3 relative  h-[430px]">
            <SearchBox
              autoFocus
              placeholder="I am looking for..."
              classNames={{
                input: "bg-slate-100 p-4 outline-none rounded-lg w-full",
                root: "items-center",
                submit: "hidden",
                reset: "hidden",
              }}
              loadingIconComponent={() => <Loader color="blue" />}
            />

            <NoResultsBoundary fallback={<NoResults />}>
              <div className="max-h-[300px] overflow-y-auto">
                <Hits hitComponent={Hit} />
              </div>
              <LoadingIndicator />
            </NoResultsBoundary>
            <br />
            <Button
              fullWidth
              className="absolute bottom-0"
              rightSection={<IconAdjustments size={16} />}
              onClick={() => {
                router.push("/all")
                spotlight.close()
              }}
            >
              Filter
            </Button>
            <br />
          </div>
        </Spotlight.Root>
      </div>
    </div>
  )
}

const Hit = ({ hit }) => {
  const router = useRouter()

  const handleSearchHit = () => {
    router.push(`/product/${hit?.id}`)
    spotlight.close()
  }

  return (
    <div className=" flex space-x-3 items-center">
      <img
        className="h-[48px] w-[48px] object-contain"
        src={hit?.colors[0]?.images[hit?.colors[0]?.primaryIndex || 0]}
        alt="Picture of the author"
        onClick={handleSearchHit}
      />
      <div>
        <Highlight
          onClick={handleSearchHit}
          attribute="model"
          className="font-bold"
          hit={hit}
        />
      </div>
    </div>
  )
}

const NoResultsBoundary = ({ children, fallback }) => {
  const { results } = useInstantSearch()

  if (!results.__isArtificial && results.nbHits === 0) {
    return (
      <>
        {fallback}
        <div hidden>{children}</div>
      </>
    )
  }

  return children
}

function NoResults() {
  const { indexUiState } = useInstantSearch()

  return (
    <div>
      <p>
        No results for <q>{indexUiState.query}</q>.
        <ClearRefinements excludedAttributes={[]} />
      </p>
    </div>
  )
}

function LoadingIndicator() {
  const { status } = useInstantSearch()

  if (status === "stalled") {
    return <p>Loading search results</p>
  }
  return null
}

export default Header
