import { CategoryCard, Footer, Header, ProductCard } from "@/components"
import {
  ADD_MAILING,
  GET_BLOGS,
  GET_CAROUSELS,
  GET_FEATURED,
  GET_FEATURED_REVIEWS,
  GET_RUNNING_OFFERS,
  GET_TECH_TIPS,
  GET_VARIANTS,
} from "@/lib/request"
import {
  Accordion,
  ActionIcon,
  Button,
  Card,
  Input,
  Modal,
  Rating,
  Skeleton,
  Text,
} from "@mantine/core"
import { useViewportSize } from "@mantine/hooks"
import {
  IconCashBanknote,
  IconCheck,
  IconChecklist,
  IconCreditCardPay,
  IconDeviceIpadCog,
  IconMail,
  IconMoneybag,
  IconPackageExport,
  IconPlayerPlay,
  IconPlus,
  IconPremiumRights,
  IconRosetteDiscountCheck,
  IconShield,
  IconShieldFilled,
  IconStar,
  IconStarFilled,
  IconTools,
  IconTruckDelivery,
  IconX,
} from "@tabler/icons-react"

import Link from "next/link"
import { useRouter } from "next/router"
import React, { useEffect, useRef, useState } from "react"
import { Configure, InstantSearch, useInfiniteHits } from "react-instantsearch"
import ReactPlayer from "react-player"
import { Carousel } from "react-responsive-carousel"
import { useMutation, useQuery } from "urql"
import { searchClient } from "./_app"
import { notifications } from "@mantine/notifications"
import {
  CorporateContactJsonLd,
  FAQPageJsonLd,
  LogoJsonLd,
  NextSeo,
} from "next-seo"
import Offer from "@/components/offer"

const Carousels = () => {
  const { width } = useViewportSize()
  const router = useRouter()
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_CAROUSELS,
  })

  return (
    <Carousel
      autoPlay
      showThumbs={false}
      showIndicators={false}
      interval={3000}
      transitionTime={500}
      swipeScrollTolerance={5}
      infiniteLoop
      showStatus={false}
      swipeable
      stopOnHover
    >
      {fetching ? (
        <div>
          <Skeleton height={width < 750 ? width : 300} width={width} />
        </div>
      ) : (
        data?.getCarousels?.map((carousel, i) => (
          <div key={i} onClick={() => router.push(`${carousel?.link}`)}>
            {width < 750 ? (
              <img
                alt="Shwari Phones official website - Affordable smartphones in Africa"
                className="aspect-square object-contain"
                onClick={() => router.push(`/${carousel?.link}`)}
                src={carousel?.smallScreen}
              />
            ) : (
              <img
                onClick={() => router.push(`/${carousel?.link}`)}
                src={carousel?.largeScreen}
              />
            )}
          </div>
        ))
      )}
    </Carousel>
  )
}

const TechBetterWithUs = () => {
  return (
    <div className="bg-slate-100 p-12 space-y-4 pb-4">
      <h1 className="font-duplet w-full text-center text-[1.5rem] lg:text-[2.5rem] font-bold">
        {" "}
        Africa&apos;s Premium Refurbished Tech Marketplace.
      </h1>
      <strong className="w-full text-center block text-[0.8rem]">
        Buy, Sell, Trade-In & Lipa pole pole phones.
      </strong>
      <br />
      <div className="rounded-xl lg:w-4/5 mx-auto bg-white grid lg:gap-x-16 grid-cols-2 lg:grid-cols-4 ">
        <div className=" col-span-1 flex p-3 items-center space-x-4">
          <ActionIcon size={36} variant="light" radius={8}>
            <IconRosetteDiscountCheck size={18} stroke={1.2} />
          </ActionIcon>
          <p className="lg:font-semibold">Professionally refurbished</p>
        </div>

        <div className="flex p-3  col-span-1 items-center space-x-4">
          <ActionIcon size={36} variant="light" radius={8}>
            <IconPremiumRights size={18} stroke={1.2} />
          </ActionIcon>
          <p className="lg:font-semibold">Lipa pole pole offered</p>
        </div>

        <div className="flex p-3 col-span-1  items-center space-x-4">
          <ActionIcon size={36} variant="light" radius={8}>
            <IconPackageExport size={18} stroke={1.2} />
          </ActionIcon>
          <p className="lg:font-semibold">Trade-in accepted</p>
        </div>

        <div className="flex p-3 col-span-1  items-center space-x-4">
          <ActionIcon size={36} variant="light" radius={8}>
            <IconDeviceIpadCog size={18} stroke={1.2} />
          </ActionIcon>
          <p className="lg:font-semibold">Trusted repair.</p>
        </div>
      </div>
    </div>
  )
}

const Featured = () => {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_FEATURED,
  })

  if (data?.getFeatured?.length > 0)
    return (
      <div className="bg-slate-100 px-4 lg:p-12 pt-8">
        <div className="space-y-1">
          <h2 className="text-[1.2rem] font-bold font-duplet">Featured</h2>
        </div>

        <div className="mt-8 no-scrollbar flex flex-nowrap space-x-6 overflow-x-auto">
          {data?.getFeatured?.map((hit) => (
            <ProductCard variant={hit} key={hit?.id} />
          ))}
        </div>
      </div>
    )

  return null
}

const Recommended = () => {
  const { items, isLastPage, showMore } = useInfiniteHits()

  return (
    <div className="bg-slate-100 px-4 lg:p-12 pt-8">
      <div className="space-y-1">
        <h2 className="text-[1.2rem] font-bold font-duplet">
          Recommended for you
        </h2>
      </div>

      <div className="mt-8 no-scrollbar flex flex-nowrap space-x-6 overflow-x-auto">
        {items.map((hit) => (
          <ProductCard variant={hit} key={hit?.id} />
        ))}
      </div>
    </div>
  )
}

const MostWanted = () => {
  return (
    <div className="bg-slate-100 px-4 lg:p-12 pt-8">
      <div className="space-y-1">
        <h2 className="text-[1.2rem] font-bold font-duplet">
          Shop our most wanted
        </h2>
      </div>
      <br />

      <div className="flex flex-wrap px-4 lg:flex-nowrap gap-8">
        {[
          {
            label: "iPhones",
            img: "/products/iPhone.webp",
            goTo: "/all?brand=Apple",
          },
          {
            label: "iPads & Tablets",
            img: "/products/iPad.webp",
            goTo: "/all?deviceType=Tablets",
          },
          {
            label: "MacBooks",
            img: "/products/mac.webp",
            goTo: "/all?deviceType=Macbook",
          },
          {
            label: "Samsungs",
            img: "/products/Samsung.webp",
            goTo: "/all?brand=Samsung",
          },
        ].map((category, i) => (
          <CategoryCard
            key={i}
            label={category?.label}
            img={category?.img}
            goTo={category?.goTo}
          />
        ))}
      </div>
      <br />
    </div>
  )
}

const BestDeals = ({ data }) => {
  const [_category, setCategory] = useState("iPhones")

  const filterFunction = (item) => {
    if (_category == "iPhones") {
      return item?.brand == "Apple" && item?.deviceType == "Phone"
    }

    if (_category == "iPads & Tablets") {
      return item?.deviceType == "Tablets"
    }

    if (_category == "MacBooks") {
      return item.deviceType == "Macbook"
    }

    if (_category == "Samsungs") {
      return item.brand == "Samsung"
    }
  }

  return (
    <div className="bg-slate-100 lg:p-12 pt-8 px-4">
      <h2 className="text-[1.2rem] font-bold font-duplet">
        Shop our best deals
      </h2>

      <div className="bg-blue-50 rounded-lg w-full lg:flex mt-4">
        <div className="lg:w-[30%]">
          <img
            src="/banners/develo.avif"
            className="object-cover w-full lg:h-[500px] h-[100px] lg:rounded-l-lg rounded-t-lg"
            alt="develo"
          />
        </div>

        <div className="lg:w-[70%] lg:p-12 pb-4">
          <div className="mt-4 lg:grid flex w-full overflow-x-auto no-scrollbar mx-auto lg:grid-cols-4 lg:gap-8 space-x-4 grid-cols-2">
            {[
              {
                label: "iPhones",
                img: "/products/iPhone.webp",
                goTo: "/all?brand=Apple",
              },
              {
                label: "iPads & Tablets",
                img: "/products/iPad.webp",
                goTo: "/all?deviceType=Tablets",
              },
              {
                label: "MacBooks",
                img: "/products/mac.webp",
                goTo: "/all?deviceType=Macbook",
              },
              {
                label: "Samsungs",
                img: "/products/Samsung.webp",
                goTo: "/all?brand=Samsung",
              },
            ].map((category) => (
              <div
                onClick={() => setCategory(category.label)}
                key={category?.label}
                className={`hover:cursor-pointer lg:py-2 py-1 shadow-sm rounded-md bg-white min-w-[100px]  flex items-center justify-center ${
                  _category == category.label && "border-black border-2"
                }`}
              >
                <div>
                  <img
                    alt={category.label}
                    className="h-[48px] mx-auto"
                    src={category.img}
                  />

                  <p className="w-full text-center mt-2">{category.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 no-scrollbar flex flex-nowrap space-x-6 overflow-x-auto">
            {data?.getVariants?.filter(filterFunction).map((hit) => (
              <ProductCard variant={hit} key={hit?.id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const TopBrands = ({ data }) => {
  const [_brand, setBrand] = useState("Apple")

  const filterFunction = (item) => {
    return item?.brand == _brand
  }

  return (
    <div className="bg-slate-100 lg:p-12 pt-8 px-4">
      <h2 className="text-[1.2rem] font-bold font-duplet">
        Top brands, refurbished
      </h2>

      <div className="bg-blue-50 rounded-lg w-full lg:flex mt-4">
        <div className="lg:w-[30%]">
          <img
            src="/banners/develo.avif"
            className="object-cover w-full lg:h-[500px] h-[100px] lg:rounded-l-lg rounded-t-lg"
            alt="develo"
          />
        </div>

        <div className="lg:w-[70%] lg:p-12 pb-4">
          <div className="mt-4 lg:grid flex w-full overflow-x-auto no-scrollbar mx-auto lg:grid-cols-4 lg:gap-8 space-x-4 grid-cols-2">
            {["Apple", "Samsung", "OnePlus", "Google Pixel"].map((brand) => (
              <div
                onClick={() => setBrand(brand)}
                key={brand}
                className={`hover:cursor-pointer py-1 min-w-[120px] shadow-sm rounded-md bg-[#172554] bg-opacity-15  flex items-center justify-center ${
                  _brand == brand && "border-black border-2"
                }`}
              >
                <div>
                  <img
                    alt={brand}
                    className="h-[32px] mx-auto"
                    src={`/brands/${brand}.png`}
                  />
                  <p className="w-full text-center mt-3">{brand}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 no-scrollbar flex flex-nowrap space-x-6 overflow-x-auto">
            {data?.getVariants?.filter(filterFunction).map((hit) => (
              <ProductCard variant={hit} key={hit?.id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const Reviews = () => {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_FEATURED_REVIEWS,
  })

  const router = useRouter()

  return (
    <div className="bg-slate-100 lg:p-12 p-4">
      <h2 className="text-[1.2rem] font-bold font-duplet">Over 2M customers</h2>
      <div className="flex py-8 mt-6 gap-x-4 no-scrollbar w-full overflow-x-auto lg:px-8">
        {data?.getFeaturedReviews?.map((review) => (
          <div
            key={review?.id}
            className="relative min-w-[200px]  rounded-lg  max-w-[200px] aspect-video"
          >
            <Card
              radius={24}
              w={250}
              className="hover:cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              <Card.Section>
                <div className="relative min-h-[250px] bg-gradient-to-t from-black to-transparent">
                  {review?.image ? (
                    <img
                      src={review?.image}
                      className="h-[250px] object-cover"
                      alt="review"
                    />
                  ) : (
                    <div className="h-[250px] w-full bg-black" />
                  )}

                  <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                  <div className="absolute bottom-0 space-y-2 z-10 text-white p-6">
                    <Text lineClamp={3}>{review?.review}</Text>

                    <div className="flex items-center">
                      <Rating defaultValue={review?.rating} size={12} />
                      <span className="text-[0.6rem] ml-3">5/5</span>
                    </div>
                  </div>
                </div>
              </Card.Section>
              <div
                onClick={() => router.push(`/product/${review?.product?.id}`)}
                className="flex items-center space-x-2 p-3"
              >
                <img
                  className="w-[48px] h-[48px] object-contain"
                  src={review?.product?.colors[0]?.images[0]}
                  alt="iphone"
                />
                <strong className="text-[0.8rem] hover:cursor-pointer">
                  {review?.product?.model}
                </strong>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}

const AboutTradeIn = () => {
  const router = useRouter()

  return (
    <div className="bg-slate-100 lg:px-12 p-4">
      <div className="rounded-md bg-[#172554]  lg:p-12 p-6">
        <div className="lg:flex lg:w-[85%] lg:space-x-12 mx-auto justify-between">
          <div className="space-y-6">
            <h1 className="font-duplet  text-white text-[2rem] font-bold leading-10">
              Get up to Ksh. 45,000 for your trade-in.{" "}
            </h1>
            <p className="text-white block text-[0.8rem] lg:text-[1rem]">
              Trade the tech you do not want for cash you do.
            </p>
            <Button
              onClick={() => router.push("/new-tradein")}
              color="yellow"
              size="lg"
              fullWidth
            >
              <p className="text-black text-[1rem]">
                Learn more about Trade-in
              </p>
            </Button>
          </div>

          <div className="bg-white rounded p-3 space-y-3 mt-[48px] w-4/5 mx-auto">
            <div className="flex space-x-2 items-center">
              <ActionIcon variant="light" color="yellow" size={48}>
                <IconChecklist size={24} />
              </ActionIcon>
              <p>Highest offer out of 250+ refurbishers</p>
            </div>

            <div className="flex space-x-2 items-center">
              <ActionIcon variant="light" color="yellow" size={48}>
                <IconCashBanknote size={24} />
              </ActionIcon>
              <p>Fast cash payment directly deposited</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const NewsLetter = () => {
  const [mail, setMail] = useState("")
  const [loading, setLoading] = useState(false)

  const [_, _addMailing] = useMutation(ADD_MAILING)

  const handleSubscribe = () => {
    if (!mail) {
      notifications.show({
        title: "Enter email",
        color: "orange",
        message: "Enter an email to get informed about new deals and offers ",
      })
      return
    }

    setLoading(false)

    _addMailing({
      email: mail,
    })
      .then(({ data, error }) => {
        if (data && !error) {
          notifications.show({
            title: "Subscribed",
            color: "green",
            icon: <IconCheck />,
          })
        }
      })
      .finally(() => {
        setMail("")
        setLoading(false)
      })
  }

  return (
    <div className="bg-slate-100 lg:p-12">
      <div className="flex rounded-md justify-center bg-yellow-500 lg:p-6 p-6">
        <div className="space-y-3 lg:w-3/5 ">
          <h1 className="font-duplet text-[2rem] font-bold leading-10">
            Get 2,000 bob off your first order.
          </h1>
          <p className="font-normal text-[0.9rem]">
            On orders above Ksh.50,000 when you buy via the website
          </p>
          <br />
          <div className="lg:flex space-y-2 lg:space-y-0 justify-between w-full lg:space-x-4">
            <Input
              size="lg"
              className="w-full"
              placeholder="Email"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              rightSection={<IconMail stroke={1} />}
            />

            <Button
              fullWidth
              loading={loading}
              disabled={loading}
              onClick={handleSubscribe}
              className="w-[250px]"
              size="lg"
            >
              Sign up
            </Button>
          </div>
          <br />
          <p className="text-[0.7rem]">
            By subscribing, you agree to receive our promotional communications
            via email. You can unsubscribe at any time using the link in any of
            our marketing emails, or request to access, rectify, or delete your
            data
          </p>
        </div>
      </div>
    </div>
  )
}

const TakeCareOfYourTech = () => {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_TECH_TIPS,
  })

  return (
    <div className="bg-slate-100 lg:p-12 p-4 pt-8 lg:pt-0">
      <h2 className="text-[1.2rem] font-bold font-duplet">
        Take care of your tech
      </h2>

      <div className="flex mt-6 gap-x-4 no-scrollbar w-full overflow-x-auto lg:px-8">
        {(data?.getTechTips ?? []).map((tip) => (
          <div
            key={tip.id}
            className="relative min-w-[250px] rounded-lg h-[400px] max-w-[200px] aspect-video"
          >
            <ReactPlayer url={tip.link} controls width="100%" height="100%" />
          </div>
        ))}
      </div>
    </div>
  )
}

const HelpsPlanet = () => {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_BLOGS,
  })

  const router = useRouter()

  return (
    <div className="bg-slate-100 lg:p-12 p-4 lg:pt-0 pt-8">
      <h2 className="text-[1.2rem] font-bold font-duplet">
        Refurbished tech helps the planet
      </h2>
      <div className="flex mt-6 gap-x-4 no-scrollbar w-full overflow-x-auto">
        {(data?.getBlogs ?? []).map((blog) => (
          <Card
            onClick={() => router.push(`/blog/${blog.id}`)}
            key={blog?.id}
            w={250}
            className="hover:shadow-lg min-w-[250px] hover:cursor-pointer"
          >
            <Card.Section>
              <img
                src={blog.thumbnail}
                className="h-[150px] w-full object-cover"
                alt="iphone"
              />
            </Card.Section>
            <div className="mt-3 p-2 space-y-1">
              <p className="text-slate-500 text-[0.8rem] uppercase">
                {blog.category}
              </p>
              <p className="font-bold text-[0.9rem]">{blog.title}</p>
            </div>
          </Card>
        ))}
      </div>
      <br />
      <div className="flex justify-center mt-8">
        <Button onClick={() => router.push("/blog/all")} w={250}>
          Read more
        </Button>
      </div>
      <br />
    </div>
  )
}

const FAQs = () => {
  return (
    <div className="py-8 space-y-12">
      <div className="lg:w-3/5 w-4/5 mx-auto space-y-12 mb-12">
        <strong className="text-[1.5rem] font-duplet">
          The 3 questions people always ask.
        </strong>
        <br />
        <Accordion>
          <Accordion.Item value="1">
            <Accordion.Control>
              <strong>How long is the delivery time?</strong>
            </Accordion.Control>
            <Accordion.Panel className="py-3">
              Delivery times vary depending on your location and the selected
              shipping method. Typically, orders are delivered within 1-2
              business days and in the same day within Nairobi.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="2">
            <Accordion.Control>
              <strong> How does Shwariphones guarantee quality?</strong>
            </Accordion.Control>
            <Accordion.Panel className="py-3">
              From a pre-listing screening process , we make sure to only sell
              you authentic products. It&apos;s also why every device comes with
              a 6 month warranty.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="3">
            <Accordion.Control>
              <strong>
                {" "}
                What’s the difference between refurbished and new?
              </strong>
            </Accordion.Control>
            <Accordion.Panel className="py-3">
              On the outside, a refurbished smartphone looks and works like new.
              But it&apos;s what&apos;s on the inside that really counts.
              Refurbished tech helps keep e-waste out of our landfills, water,
              and air.
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </div>
    </div>
  )
}

const TopBanner = () => {
  const router = useRouter()
  const [topBanner, setTopBanner] = useState(true)

  return (
    <div
      className={`${
        !topBanner && "hidden"
      } p-4 bg-[#B3C8EF] flex justify-between items-center top-0 sticky `}
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
  )
}

const Offers = () => {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_RUNNING_OFFERS,
  })

  return (
    <div className="bg-slate-100 p-12 space-y-4 pb-4">
      {data?.getRunningOffers?.length > 0 &&
        data?.getRunningOffers?.map((offer, i) => (
          <Offer key={i} offer={offer} />
        ))}
    </div>
  )
}

function Home() {
  const [{ data, fetching, error }] = useQuery({
    query: GET_VARIANTS,
  })

  return (
    <main>
      <NextSeo
        title="Shwari Phones Africa - Official Website | Africa’s Premium Refurbished Tech Marketplace"
        description="Visit Shwari Phones' official website to explore affordable smartphones, trade-in services, and flexible payment plans in Africa."
        canonical="https://shwariphones.africa"
        openGraph={{
          url: "https://shwariphones.africa",
          title: "Shwari Phones - Buy, Sell, Trade-In & Lipa Pole Pole Phones",
          description:
            "Visit Shwari Phones' official website for the best phone deals, trade-ins, and flexible payment plans.",
          images: [
            {
              url: "/logo.webp", // Carousel 1
              width: 800,
              height: 600,
              alt: "Shwari Phones official website - Affordable smartphones in Africa",
              type: "image/jpeg",
            },
          ],
          siteName: "Shwari Phones",
        }}
        twitter={{
          handle: "@ShwariPhones",
          site: "@ShwariPhones",
          cardType: "summary_large_image",
        }}
        robotsProps={{
          nosnippet: false,
          notranslate: true,
          noimageindex: false,
          noarchive: true,
          maxSnippet: -1,
          maxImagePreview: "standard",
          maxVideoPreview: -1,
        }}
      />

      <CorporateContactJsonLd
        url="https://shwariphones.africa"
        logo="/logo.png"
        contactPoint={[
          {
            telephone: "+254705820082",
            contactType: "Customer service",
            email: "info@shwariphones.africa",
            areaServed: "KE",
            availableLanguage: ["English"],
          },
        ]}
      />

      <FAQPageJsonLd
        mainEntity={[
          {
            questionName: "How long is the delivery time?",
            acceptedAnswerText: "1-2 business days.",
          },
          {
            questionName: "How does Shwariphones guarantee quality?",
            acceptedAnswerText:
              "From a pre-listing screening process , we make sure to only sell you authentic products. It's also why every device comes with a 6 month warranty and 30 days to change your mind.",
          },
          {
            questionName: "What’s the difference between refurbished and new?",
            acceptedAnswerText:
              "On the outside, a refurbished smartphone looks and works like new. But it's what's on the inside that really counts. Refurbished tech helps keep e-waste out of our landfills, water, and air.",
          },
        ]}
      />

      <LogoJsonLd
        logo="/logo.webp" //URL
        url="https://shwariphones.africa"
      />

      <Header />
      <TopBanner />
      <Carousels />
      <TechBetterWithUs />
      <Offers />
      <Featured />
      {/* <Recommended /> */}
      <MostWanted />
      <BestDeals data={data} />
      {/* <CarouselsBottom /> */}
      <AboutTradeIn />
      <TopBrands data={data} />
      <Reviews />
      <NewsLetter />
      <TakeCareOfYourTech />
      <HelpsPlanet />
      <FAQs />
      <Footer />
    </main>
  )
}

export default Home
