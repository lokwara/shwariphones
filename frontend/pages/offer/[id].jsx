import { Footer, Header, ProductCard } from "@/components"
import {
  Accordion,
  ActionIcon,
  Badge,
  Button,
  Card,
  ColorSwatch,
  Divider,
  Drawer,
  Group,
  Image,
  Modal,
  NumberInput,
  Radio,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core"
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconChevronRight,
  IconHeart,
  IconInfoCircle,
  IconInfoCircleFilled,
  IconPower,
  IconShieldCheckFilled,
  IconTruck,
  IconTruckDelivery,
  IconX,
} from "@tabler/icons-react"
import Link from "next/link"
import React, { useCallback, useEffect, useState } from "react"
import { Carousel } from "react-responsive-carousel"
import classes from "../../styles/Custom.module.css"
import { useRouter } from "next/router"
import { useMutation, useQuery } from "urql"
import { ADD_TO_CART, GET_DEVICE, GET_SUGGESTIONS } from "@/lib/request"
import { supabaseBrowser, useSupabaseSession } from "@/lib/supabaseBrowser"
import { notifications } from "@mantine/notifications"
import models from "@/lib/models.json"
import Loader from "@/components/loader"
import { useUser } from "@/context/User"
import { useViewportSize, useWindowScroll } from "@mantine/hooks"
import moment from "moment"
import Head from "next/head"
import { BreadcrumbJsonLd, NextSeo, ProductJsonLd } from "next-seo"
import AcceptedPayments from "@/components/acceptedpayments"

function Product() {
  const router = useRouter()
  const [scroll, scrollTo] = useWindowScroll()

  const { width } = useViewportSize()
  const { session } = useSupabaseSession()
  const [isSticky, setIsSticky] = useState(false)
  const [tradeInOpen, setTradeInOpen] = useState(false)

  const [loadingAdd, setLoadingAdd] = useState(false)

  const [topBanner, setTopBanner] = useState(true)

  const { user, refreshApp } = useUser()

  const { id } = router.query

  const [{ data, fetching, error }] = useQuery({
    query: GET_DEVICE,
    variables: {
      getDeviceId: id,
    },
  })

  const [_, _addToCart] = useMutation(ADD_TO_CART)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const triggerPoint = 500 // Adjust this value to the point where you want the div to stick

      if (scrollY >= triggerPoint) {
        setIsSticky(true)
      } else {
        setIsSticky(false)
      }
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleThumbnailClick = (index) => {
    setSelectedIndex(index)
  }

  const handleAddToCart = () => {
    setLoadingAdd(true)

    if (!session?.user?.email) {
      supabaseBrowser.auth.signInWithOAuth({ provider: 'google' })
      return
    }

    _addToCart({
      email: session?.user?.email,
      device: id,
    })
      .then(({ data }, error) => {
        if (data?.addToCart && !error) {
          notifications.show({
            message: `"${device?.variant?.model}" added to cart successfully`,
            icon: <IconCheck />,
            color: "green",
          })

          refreshApp()
        } else {
          notifications.show({
            message: `This device is already in your cart`,
            icon: <IconInfoCircleFilled />,
            color: "orange",
          })
        }
        return
      })
      .finally(() => {
        setLoadingAdd(false)
      })
  }

  const device = data?.getDevice

  return (
    <div>
      {/* <ProductJsonLd
        productName={`${device.brand}-${device.model}-${device.storage}`}
        images={device?.images}
        description={device?.description}
        brand={device?.brand}
        color={device?.color}
        aggregateRating={{
          ratingValue: "4.8",
          reviewCount: "89",
        }}
        offers={[
          {
            price: device.currentPrice.toLocaleString("en-US"),
            priceCurrency: "KES",
            itemCondition: "https://schema.org/NewCondition",
            availability: "https://schema.org/InStock",
            url: `https://shwariphones.africa/products/${id}}`,
            seller: {
              name: "Shwari Phones",
            },
          },
        ]}
        mpn="925872"
      /> */}

      <Header />

      <div
        className={`${
          !topBanner && "hidden"
        } p-4 bg-[#B3C8EF] flex justify-between items-center`}
      >
        <p className="text-[0.7rem] font-semibold">
          Trade in tech you don&apos;t want for cash you do.{" "}
          <span
            className="underline hover:cursor-pointer"
            onClick={() => router.push("/new-tradein")}
          >
            Get started
          </span>{" "}
        </p>
        <Button
          onClick={() => setTopBanner(false)}
          w={32}
          h={32}
          p={0}
          variant="transparent"
          color="black"
        >
          <IconX />
        </Button>
      </div>

      <div className="p-8">
        <div className="flex justify-between">
          <div className="flex space-x-8">
            <UnstyledButton onClick={() => router.back()} className="mt-[-6px]">
              <IconArrowLeft />
            </UnstyledButton>
            <h1 className="font-semibold">{device?.variant?.model}</h1>
          </div>
          <div>
            {/* <UnstyledButton>
              <IconHeart />
            </UnstyledButton> */}
          </div>
        </div>

        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="p-8 lg:col-span-1">
            <Carousel
              autoPlay
              showThumbs={false}
              showIndicators={false}
              interval={3000}
              infiniteLoop
              selectedItem={selectedIndex}
              onChange={(index) => setSelectedIndex(index)}
            >
              {device?.color?.images?.map((img, i) => {
                return (
                  <div key={i} className="lg:p-12">
                    <img src={img} className="h-[50vh] object-contain" />
                  </div>
                )
              })}
            </Carousel>

            <div className="flex justify-center gap-2 mt-4">
              {device?.color?.images?.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={image}
                  onClick={() => handleThumbnailClick(index)}
                  className={`
              w-20 h-14 object-contain p-2 rounded-md cursor-pointer transition-all duration-300 
              ${
                selectedIndex === index
                  ? "border-2 border-blue-500 shadow-lg"
                  : "border-2 border-transparent"
              }
            `}
                />
              ))}
            </div>

            {width > 750 && (
              <TechnicalSpecifications
                specs={device?.variant?.technicalSpecifications}
              />
            )}
          </div>

          <div className="space-y-6 lg:col-span-1">
            <div className="space-y-2">
              <h1 className="font-semibold">
                {device?.variant?.model} - {device?.storage?.label} -{" "}
                {device?.color?.label}
              </h1>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-semibold lg:text-[2rem] text-[1.5rem]">
                  Ksh. {device?.offer?.price?.toLocaleString("en-US")}
                </h1>

                <>
                  <p className="line-through text-[0.8rem] text-gray-500">
                    Ksh. {device?.storage?.price?.toLocaleString("en-US")}
                  </p>
                  <Badge color="#94f5bc" radius={"xs"} className="mt-2">
                    <p className="text-[#006b40] text-[0.7rem]">
                      Save Ksh.
                      {(
                        device?.storage?.price - device?.offer?.price
                      )?.toLocaleString("en-US")}
                    </p>
                  </Badge>
                </>
              </div>

              <Button
                size="lg"
                onClick={handleAddToCart}
                loading={loadingAdd}
                disabled={loadingAdd}
              >
                <p className="text-[0.8rem] font-normal">Add to cart</p>
              </Button>
            </div>
            <div>
              <Badge
                color="#edeff3"
                size="lg"
                className="mt-3 w-full"
                onClick={() => setTradeInOpen(true)}
              >
                <div className="flex items-center space-x-4">
                  <img src="/trade-in.svg" className="h-[12px]" />
                  {/* <Image
                    src="/trade-in.svg"
                    alt="Trade-in"
                    width={12}
                    height={12}
                    className="h-[12px] w-auto"
                  /> */}
                  <p className="text-black normal-case font-medium">
                    Get this for even less with trade in
                  </p>
                  <IconChevronRight color="black" size={16} />
                </div>
              </Badge>

              {/* Trade In information */}
              {width < 750 ? (
                <Drawer
                  position="bottom"
                  size="90%"
                  opened={tradeInOpen}
                  onClose={() => setTradeInOpen(false)}
                  title={null}
                >
                  <TradeInInfo />
                </Drawer>
              ) : (
                <Modal
                  opened={tradeInOpen}
                  onClose={() => setTradeInOpen(false)}
                  title={null}
                >
                  <TradeInInfo />
                </Modal>
              )}
            </div>

            <Divider />
            <EveryPurchase />
            <Options device={device} />
            {width < 750 && (
              <TechnicalSpecifications
                specs={device?.variant?.technicalSpecifications}
              />
            )}
          </div>
        </div>
      </div>
      <YouMayAlsoLike
        variant={device?.variant?.id}
        brand={device?.variant?.brand}
      />
      <div className="p-8 space-y-12">
        <AcceptedPayments />
      </div>
      <Footer />

      <div
        className={`fixed left-0 right-0 p-4 bg-white border border-t-[1px]  transition-transform duration-300 ${
          isSticky ? "bottom-0" : "-bottom-full"
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="mt-1">
            <h1 className="font-semibold">
              Ksh. {device?.offer?.price?.toLocaleString("en-US")}
            </h1>

            <p className="line-through text-[0.8rem] text-gray-500">
              Ksh. {device?.storage?.price?.toLocaleString("en-US")}
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleAddToCart}
            loading={loadingAdd}
            disabled={loadingAdd}
          >
            <p className="text-[0.8rem] font-normal">Add to cart</p>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Product

const EveryPurchase = () => {
  return (
    <div>
      <div className="flex space-x-4">
        <ActionIcon
          color="#002540"
          size={48}
          variant="light"
          aria-label="Delivery"
        >
          <IconTruckDelivery />
        </ActionIcon>

        <div className="space-y-1">
          <p className="text-[1rem] font-medium">Countrywide delivery</p>
          <p className="text-[0.7rem]">
            Estimated arrival from{" "}
            {moment(new Date().setDate(new Date().getDate() + 1)).format(
              "Do MMM"
            )}
            -{" "}
            {moment(new Date().setDate(new Date().getDate() + 2)).format(
              "Do MMM"
            )}
            .Same day delivery within Nairobi
          </p>
        </div>
      </div>

      <br />
      <div className="flex space-x-4">
        <ActionIcon
          color="#002540"
          size={48}
          variant="light"
          aria-label="Delivery"
        >
          <IconShieldCheckFilled />
        </ActionIcon>

        <div className="space-y-1">
          <p className="text-[1rem] font-medium">Verified Refurbished</p>
          <p className="text-[0.7rem]">Quality assured product</p>
        </div>
      </div>
      <br />

      <Divider />
    </div>
  )
}

const Options = ({ device }) => {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-medium text-[1.05rem] mb-2">
          {device?.variant?.deviceType == "Phone" ||
          device?.variant?.deviceType == "Macbook" ||
          device?.variant?.deviceType == "Tablets"
            ? "Storage"
            : "Options"}
        </p>
        <div className="flex gap-4 flex-wrap">
          <div
            className={`bg-[#b3c8ef] flex space-x-3 text-[0.8rem]  rounded-md border border-black hover:cursor-pointer
               p-2 items-center `}
          >
            <span>{device?.storage?.label}</span>
          </div>
        </div>
      </div>

      <div>
        <p className="font-medium text-[1.05rem] mb-2">Color</p>
        <div className="flex gap-4 flex-wrap">
          <div
            className={`bg-[#b3c8ef] flex space-x-3 text-[0.8rem]  rounded-md border border-black hover:cursor-pointer p-2 items-center `}
          >
            <ColorSwatch color={device?.color?.colorCode} size={16} />
            <span>{device?.color?.label}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[1rem] font-medium">Comes with</p>
        <div className="flex flex-wrap gap-2">
          <div className="flex space-x-2 bg-gray-200 px-4 py-2 rounded-full">
            <IconShieldCheckFilled />
            <span className="text-[0.8rem] mt-[2px]">6 months warranty</span>
          </div>
          <div className="flex space-x-2 bg-gray-200 px-4 py-2 rounded-full">
            <IconTruckDelivery />
            <span className="text-[0.8rem] mt-[2px]">Afforadable shipping</span>
          </div>
        </div>
      </div>

      <Divider />
    </div>
  )
}

const TechnicalSpecifications = ({ specs }) => {
  return (
    <Accordion defaultValue="1">
      <Accordion.Item value="1">
        <Accordion.Control>
          <h1 className=" font-medium">Technical Specifications</h1>
        </Accordion.Control>
        <Accordion.Panel>
          <div className="space-y-2">
            {specs?.map((spec, index) => (
              <div
                key={index}
                className=" border-b-[0.3px] relative grid grid-cols-3 justify-between mb-2 "
              >
                <p className="col-span-1">{spec?.label}</p>
                <p className=" col-span-2 item-center text-gray-600 text-right   ">
                  {spec?.value}
                </p>
              </div>
            ))}
          </div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}

const YouMayAlsoLike = ({ variant_id, brand }) => {
  const [{ data, fetching, error }] = useQuery({
    query: GET_SUGGESTIONS,
    variables: {
      brand,
    },
  })
  return (
    <div className="bg-slate-100 p-8 space-y-8">
      <h1 className="text-[1.3rem] font-semibold">More from {brand}</h1>

      <div className=" no-scrollbar flex flex-nowrap space-x-6 overflow-x-auto">
        {data?.getSuggestions
          ?.filter(({ id }) => id !== variant_id)
          .map((_variant) => (
            <ProductCard key={_variant?.id} variant={_variant} />
          ))}
      </div>
    </div>
  )
}

const TradeInInfo = () => {
  return (
    <div className="space-y-6 p-2">
      <p className="w-full  text-center pb-4  border-b-[1px]">Trade in</p>
      <img src="/step-trade-in.svg" alt="trade-in" className="rounded-lg" />

      <h1 className="font-duplet font-bold text-[1.4rem] text-center">
        How Trade-in works
      </h1>
      <br />
      {[
        {
          title: "Get a price",
          description:
            "Get an estimate of your device via our Ai powered platform.",
        },
        {
          title: "Bring us the device",
          description:
            "Visit our shop or send the phone to our shop for a final physical evaluation with the phone receipt or box.",
        },
        {
          title: "Get Paid",
          description: "Get paid instant cash or Upgrade your tech!",
        },
      ].map((step, i) => (
        <div
          key={i}
          className="flex space-x-4 justify-between px-4 border-b-[1px] pb-6"
        >
          <span>
            <img
              src={`/${i + 1}.png`}
              className="min-w-[100px] max-w-[100px]"
              alt="1"
            />
          </span>
          <div className="space-y-2">
            <p className="font-bold">{step?.title}</p>
            <p className="text-gray-600">{step?.description}</p>
          </div>
        </div>
      ))}
      <br />
      <Button
        fullWidth
        variant="outline"
        color="dark"
        size="lg"
        onClick={() => router.push("/new-tradein")}
      >
        Get started
      </Button>
      <br />
    </div>
  )
}
