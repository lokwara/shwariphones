import { supabase } from "./lib/supabase.js"
import nodemailer from "nodemailer"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"

import dotenv from "dotenv"

import moment from "moment"

dotenv.config()

// const APP_PASSWORD = "ovcs qfej elsy odjv";

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: "info@shwariphones.africa",
//     pass: APP_PASSWORD,
//   },
// });

const APP_PASSWORD = "hrag njpx iuem cqsm"

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "info@shwariphones.africa",
    pass: APP_PASSWORD,
  },
  logger: true, // Enable debugging
  debug: true,
})

function omit(obj, ...props) {
  const result = { ...obj }
  props.forEach(function (prop) {
    delete result[prop]
  })
  return result
}

async function sendText(to, message) {
  try {
    const response = await fetch(
      "https://portal.bunicom.com/api/services/sendsms/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apikey: "113ae9a54c89a506c688f49ef1d55ab9",
          partnerID: "10398",
          mobile: to,
          message,
          shortcode: "SHWARI",
          pass_type: "plain",
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw new Error(`Failed to send SMS. ${error.message}`)
  }
}

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
  ],
})

const doc = new GoogleSpreadsheet(
  "1pGV-bfrzx6rPpgzAvzW_mfo4Yph5Yt435QH_T_nTFx0",
  serviceAccountAuth
)

async function googleSheetAction(
  sheetTitle,
  action,
  searchColumn,
  searchValue,
  data
) {
  await doc.loadInfo()
  const sheet = doc.sheetsByTitle[sheetTitle]

  if (action == "APPEND") {
    if (Array.isArray(data)) {
      await sheet.addRows(data)
    } else {
      await sheet.addRow(data)
    }
  } else if (action == "UPDATE") {
    for (let i = 0; i < Object.keys(rows).length; i++) {
      const rows = await sheet.getRows()

      if (rows[i].get(searchColumn) == searchValue) {
        console.log("Got it")
        rows[i].assign(data)
        await rows[i].save()
      }
    }
  }
}

const resolvers = {
  Variant: {
    reviews: async (parent, args) => {
      const orders = await Order.find({
        variant: parent?._id,
        review: { $exists: true },
      })

      let reviews = []

      for (let order of orders) {
        if (!order?.review?.removed) {
          let review = {
            id: order?.review?.id,
            rating: order?.review?.rating,
            review: order?.review?.review,
            image: order?.review?.image,
            date: order?.saleInfo?.payment?.timestamp,
            customer: await User.findById(order?.saleInfo?.customer),
            featured: order?.review?.featured,
            removed: order?.removed,
          }

          reviews.push(review)
        }
      }

      return reviews
    },
  },

  User: {
    tradeIns: async (parent, args) => {
      // Return empty array for now since BuyBack model is not available
      return []
    },
    cart: async (parent, args) => {
      const { cart } = parent

      let cartItem = []

      for (let i = 0; i < cart?.length; i++) {
        if (cart[i]?.variant) {
          let variant = await Variant.findById(cart[i]?.variant)

          variant
            ? cartItem.push({
                id: cart[i]?.id,
                variant,
                storage: cart[i]?.storage,
                color: cart[i]?.color,
                onOffer: false,
              })
            : null
        } else if (cart[i]?.device) {
          let device = await Device.findById(cart[i]?.device)
            .populate("variant")
            .populate("offer.info")

          let now = new Date().getTime()

          if (
            device &&
            device?.status == "Available" &&
            now > parseInt(device?.offer?.info?.start) &&
            now < parseInt(device?.offer?.info?.end)
          ) {
            cartItem.push({
              id: cart[i]?.id,
              variant: device?.variant,
              storage: device?.storage,
              color: device?.color,
              device,
              onOffer: true,
            })
          }
        }
      }

      return cartItem
    },
    orders: async (parent, args) => {
      // Return empty array for now since Order model is not available
      return []
    },
    financingRequests: async (parent, args) => {
      // Return empty array for now since FinanceRequest model is not available
      return []
    },
  },

  Device: {
    variant: async (parent, args) => {
      const variant = await Variant.findById(parent?.variant)
      return variant
    },

    color: async (parent, args) => {
      const variant = await Variant.findById(parent?.variant)
      return variant?.colors?.find(({ id }) => id == parent?.color)
    },

    storage: async (parent, args) => {
      const variant = await Variant.findById(parent?.variant)
      return variant?.storages?.find(({ id }) => id == parent?.storage)
    },

    metadata: async (parent, args) => {
      let repair = await Repair.findOne({ device: parent?.id })

      const repairCost = () => {
        let cost =
          repair?.partsBought?.reduce((a, o) => {
            return a + o?.cost
          }, 0) + repair?.serviceCost

        if (cost) return cost
        return 0
      }

      const metadata = {
        sourceName: parent?.metadata?.sourceName,
        sourceType: parent?.metadata?.sourceType,
        sourceDefects: parent?.metadata?.sourceDefects,
        isRepaired:
          parent?.metadata?.sourceDefects?.length > 0 && repair?.dateFixed
            ? true
            : parent?.metadata?.sourceDefects?.length > 0 && !repair?.dateFixed
            ? false
            : true,
        repairDate: new String(repair?.dateFixed),
        repairCost,
      }

      return metadata
    },
  },

  Order: {
    device: async (parent, args) => {
      const device = await Device.findById(parent?.device).populate(
        "offer.info"
      )

      return device
    },
  },

  Query: {
    getFeatured: async () => {
      const { data: variants } = await supabase
        .from('variants')
        .select('*')
        .eq('featured', true)
        .eq('removed', false)
      return variants
    },

    getBlogs: async () => {
      const blogs = await Blog.find({})
        .sort({ createdAt: -1 })
        .select("id title thumbnail category content")
      return blogs
    },

    getBlog: async (_, { id }) => {
      const blog = await Blog.findById(id)
      return blog
    },
    getTechTips: async () => {
      const techTips = await TechTip.find({}).populate("createdBy")
      return techTips
    },
    getFeaturedReviews: async () => {
      const orders = await Order.find({})

      let reviews = []

      for (let order of orders) {
        if (order?.review && order?.review?.featured) {
          let review = {
            id: order?.review?.id,
            rating: order?.review?.rating,
            review: order?.review?.review,
            image: order?.review?.image,
            date: order?.review?.date,
            customer: await User.findById(order?.saleInfo?.customer),
            product: await Variant.findById(order?.variant),
            featured: order?.review?.featured,
          }

          reviews.push(review)
        }
      }

      return reviews
    },

    getReviews: async () => {
      const orders = await Order.find({})

      let reviews = []

      for (let order of orders) {
        if (order?.review) {
          let review = {
            id: order?.review?.id,
            rating: order?.review?.rating,
            review: order?.review?.review,
            image: order?.review?.image,
            date: order?.review?.date,
            customer: await User.findById(order?.saleInfo?.customer),
            product: await Variant.findById(order?.variant),
            featured: order?.review?.featured,
          }

          reviews.push(review)
        }
      }

      return reviews
    },

    testMail: async () => {
      const html = `
      <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order confirmation</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div class="bg-blue-100 p-8">
      <div class="flex justify-center">
        <img
          class="h-[56px]"
          src="https://res.cloudinary.com/oligarch/image/upload/v1742233794/logo_hasnlh.png"
          alt="Logo"
        />
      </div>
      <br />
      <h1 class="w-full text-center font-bold text-[2rem]">
        Order confirmation
      </h1>
      <br />
      <p>Hey Stephen,</p>
      <br />
      <p>
        Thank you for your purchase! We're excited to confirm your order and get
        your new device ready for you. Below are the details:
      </p>
      <br />
      <strong>Order Details:</strong>
      <div class="flex">
        <strong>📌 Product Name : </strong>
        <p class="ml-2">iPhone 13 Pro - 256 GB - White</p>
      </div>
      <div class="flex">
        <strong>📌 Quantity : </strong>
        <p class="ml-2">1</p>
      </div>
      <div class="flex">
        <strong>📌 Total Amount : </strong>
        <p class="ml-2">Ksh. 45,000</p>
      </div>
      <div class="flex">
        <strong>📌 Estimated Delivery Date : </strong>
        <p class="ml-2">12th February, 2025</p>
      </div>
      <br />
      <strong> 🛡️ 6-Month Warranty - We've Got You Covered! </strong>
      <p class="italic">
        If your product gets damaged within <strong>6 months,</strong> we'll
        repair it for free under our warranty policy.
      </p>
      <br />

      <strong> 🛡️ More Than Just a Phone Store! </strong>
      <p class="italic">
        At <strong>Shwari Phones,</strong> we offer more than just phones.
      </p>
      <div class="flex">
        <strong>✔️ Trade-in & trade-out - </strong>
        <p class="ml-2">Upgrade or swap your device hassle-free</p>
      </div>
      <div class="flex">
        <strong>✔️ Accessories - </strong>
        <p class="ml-2">Chargers, phone cases & more to complete your setup</p>
      </div>
      <div class="flex">
        <strong>✔️ Reliable repairs - </strong>
        <p class="ml-2">Fast & professional phone repair services</p>
      </div>

      <br />
      <strong>⚡ Complete Your Purchase! </strong>
      <p class="italic">
        -Most new phones <strong>don't come with a charger -</strong> grab one
        now and stay powered up!
      </p>
      <br />
      <div class="flex justify-center">
        <a href="" class="mx-auto text-white rounded-md py-2 px-4 bg-orange-500"
          >Get A Charger Now!</a
        >
      </div>
      <br />
      <p>
        We'll send you another update once your order has been shipped. In the
        meantime , you can track your order here:
      </p>
      <br />
      <div class="flex justify-center">
        <a href="" class="mx-auto text-white rounded-md py-2 px-4 bg-indigo-600"
          >TRACK ORDER STATUS</a
        >
      </div>
      <br />
      <p class="text-[0.8rem] text-center">
        Got a question? Email us at
        <a
          class="underline text-indigo-600"
          href="mailto:info@shwariphones.africa"
          >info@shwariphones.africa</a
        >
        or give us a call at
        <a class="underline text-indigo-600" href="tel:+25405820082"
          >+254 705 820 082</a
        >
      </p>
      <br />
      <br />
      <div class="flex justify-between w-3/5 mx-auto">
        <a href="">
          <img
            class="h-[20px]"
            src="https://res.cloudinary.com/oligarch/image/upload/v1742234456/002-twitter_hbcglf.png"
            alt="X"
          />
        </a>

        <a href="">
          <img
            class="h-[20px]"
            src="https://res.cloudinary.com/oligarch/image/upload/v1742234456/004-instagram_hh7bwp.png"
            alt="Instagram"
          />
        </a>

        <a href="">
          <img
            class="h-[20px]"
            src="https://res.cloudinary.com/oligarch/image/upload/v1742234456/003-youtube_qynerj.png"
            alt="Youtube"
          />
        </a>

        <a href="">
          <img
            class="h-[20px]"
            src="https://res.cloudinary.com/oligarch/image/upload/v1742234456/001-tik-tok_hwci7z.png"
            alt="TikTok"
          />
        </a>
      </div>
      <br />
      <div class="text-[0.9rem]">
        <p class="text-center">Shwari Phones 2025, Inc. All Rights Reserved.</p>
        <p class="text-center">
          Kimathi House ,Kimathi Street , Suite 409, Nairobi , Kenya, 00100
        </p>
      </div>
      <br />
      <div class="flex w-4/5 mx-auto justify-between">
        <a href="#" class="text-gray-400">Visit Us</a>

        <a href="#" class="text-gray-400">Privacy Policy</a>
        <a href="#" class="text-gray-400">Terms of Use</a>
      </div>
    </div>
  </body>
</html>

      `
      transporter
        .sendMail({
          to: "s2kinyanjui@gmail.com",
          subject: `Order confirmation!`,
          html,
        })
        .then(() => console.log("Hey there"))
        .catch(console.log)

      return "hey"
    },
    testSheets: async () => {
      const sheet = doc.sheetsByIndex[1]
      const rows = await sheet.getRows()

      for (let i = 0; i < Object.keys(rows).length; i++) {
        if (rows[i].get("name") == "Sundar Pichai") {
          console.log("Got it")
          rows[i].assign({
            name: "Stephen Kinuthia",
            email: "s2kinyanjui@oligarch.co.ke",
          })
          await rows[i].save()
        }
      }

      return "Added perhaps"
    },

    getAvailableDevices: async (_, args) => {
      const { variant, storage, color } = args

      const devices = await Device.find({
        variant,
        storage,
        color,
        status: "Available",
      })

      console.log(devices)

      return devices
    },

    getSalesStatistics: async () => {
      try {
        const getWeeklySales = async () => {
          let last7Days = []

          const today = new Date()
          today.setHours(0, 0, 0, 0)

          for (let i = 6; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(today.getDate() - i) // Subtract days to get past dates

            last7Days.push({
              date: moment(date).format("Do MMM"), // e.g., "27 Feb"
              sales: 0,
            })
          }

          const devices = await Order.find({
            "saleInfo.payment.timestamp": { $exists: true },
            device: { $exists: true },
          })

          devices.forEach((device) => {
            const saleDate = new Date(
              parseInt(device.saleInfo.payment.timestamp)
            ) // Convert timestamp string to Date object

            const index = last7Days.findIndex(
              (day) => day.date === moment(saleDate)?.format("Do MMM")
            )

            if (index !== -1) {
              last7Days[index].sales += 1
            }
          })

          return last7Days
        }

        const getMonthlySales = async () => {
          let last6Months = []

          const today = new Date()
          today.setDate(1) // Start from the first day of the month
          today.setHours(0, 0, 0, 0)

          // Generate last 6 months
          for (let i = 5; i >= 0; i--) {
            const date = new Date(today)
            date.setMonth(today.getMonth() - i) // Go back i months

            last6Months.push({
              month: moment(date).format("MMM YYYY"), // e.g., "Sep 2023"
              sales: 0,
            })
          }

          // Fetch all devices with a sale timestamp
          const devices = await Order.find({
            "saleInfo.payment.timestamp": { $exists: true },
            device: { $exists: true },
          })

          devices.forEach((device) => {
            const saleDate = new Date(
              parseInt(device.saleInfo.payment.timestamp)
            ) // Convert timestamp string to Date object
            saleDate.setDate(1) // Normalize to the first day of the month for grouping

            const index = last6Months.findIndex(
              ({ month }) => month === moment(saleDate).format("MMM YYYY")
            )
            if (index !== -1) {
              last6Months[index].sales += 1
            }
          })

          return last6Months
        }

        const getSalesByType = async () => {
          const salesData = [
            { name: "Walk In", value: 0, color: "yellow.6" },
            { name: "Website", value: 0, color: "indigo.6" },
          ]

          // Fetch all devices that have been sold
          const devices = await Order.find({
            "saleInfo.saleVia": { $exists: true },
            device: { $exists: true },
          })

          devices.forEach((device) => {
            if (device.saleInfo.saleVia.toLowerCase() === "walk in") {
              salesData[0].value += 1 // Increment Walk In sales
            } else if (device.saleInfo.saleVia.toLowerCase() === "website") {
              salesData[1].value += 1 // Increment Website sales
            }
          })

          return salesData
        }

        const getFinancingStats = async () => {
          const stats = [
            { name: "buySimu", value: 0, color: "red.6" },
            { name: "chanteq", value: 0, color: "blue.6" },
          ]

          // Fetch all devices with financing requests
          const devices = await Order.find({
            "saleInfo.saleVia": { $exists: true },
            device: { $exists: true },
          })

          devices.forEach((device) => {
            if (device?.saleInfo?.payment?.financing === "buySimu") {
              stats[0].value += 1
            } else if (device?.saleInfo?.payment?.financing === "chanteq") {
              stats[1].value += 1
            }
          })

          return stats
        }

        const getSalesByBrand = async () => {
          const brandsSales = {}

          // Get the date 30 days ago
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          thirtyDaysAgo.setHours(0, 0, 0, 0)

          // Fetch devices sold in the last 30 days
          const devices = await Order.find({
            "saleInfo.payment.timestamp": { $exists: true },
            device: { $exists: true },
          }).populate("device") // Get brand data from Variant

          for (let device of devices) {
            const saleDate = new Date(
              parseInt(device.saleInfo.payment.timestamp)
            )

            if (saleDate < thirtyDaysAgo) return

            const brand = (await Variant.findById(device?.device?.variant))
              ?.brand

            if (!brandsSales[brand]) {
              brandsSales[brand] = 0
            }

            brandsSales[brand] += 1
          }

          // Convert to array and sort in descending order of sales
          const sortedSales = Object.entries(brandsSales)
            .map(([brand, sales]) => ({ brand, sales }))
            .sort((a, b) => b.sales - a.sales)

          return sortedSales
        }

        const getSalesByModel = async () => {
          const modelSales = {}

          // Get the date 30 days ago
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          thirtyDaysAgo.setHours(0, 0, 0, 0)

          // Fetch devices sold in the last 30 days
          const devices = await Order.find({
            "saleInfo.payment.timestamp": { $exists: true },
            device: { $exists: true },
          }).populate("device") // Get brand data from Variant

          for (let device of devices) {
            const saleDate = new Date(
              parseInt(device.saleInfo.payment.timestamp)
            )
            if (saleDate < thirtyDaysAgo) return

            const model = (await Variant.findById(device?.device?.variant))
              ?.model

            if (!modelSales[model]) {
              modelSales[model] = 0
            }

            modelSales[model] += 1
          }

          // Convert to array and sort in descending order of sales
          const sortedSales = Object.entries(modelSales)
            .map(([model, sales]) => ({ model, sales }))
            .sort((a, b) => b.sales - a.sales)

          return sortedSales
        }

        return {
          weeklySales: getWeeklySales(),
          monthlySales: getMonthlySales(),
          saleByType: getSalesByType(),
          financingRequests: getFinancingStats(),
          saleByBrand: getSalesByBrand(),
          saleByModel: getSalesByModel(),
        }
      } catch (error) {
        console.error("Error fetching sales statistics:", error)
        throw new Error("Failed to fetch sales statistics")
      }
    },

    getCarousels: async (_, args) => {
      const carousels = await Carousel.find().populate("createdBy")
      return carousels
    },

    getAllOrders: async (_, args) => {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          variants:variant_id(*),
          users:saleInfo->customer(*),
          recordedBy:saleInfo->recordedBy(*)
        `)
        .eq('saleInfo->>saleVia', 'website')
        .order('created_at', { ascending: false })

      return orders
    },

    getAllFinancingRequests: async (_, args) => {
      const requests = await FinanceRequest.find()
        .populate("variant")
        .populate("customer")
        .sort({
          createdAt: -1,
        })

      const results = []

      for (const request of requests) {
        let result = {
          id: request?.id,
          device: {
            variant: request?.variant,
            storage: request?.storage,
            color: request?.color,
          },
          financer: request?.financer,
          status: request?.status,
          date: request?.date,
          customer: request?.customer,
        }

        results.push(result)
      }

      return results
    },

    getDevice: async (_, { id }) => {
      const { data: device } = await supabase
        .from('devices')
        .select(`
          *,
          variants:variant_id(*),
          offers:offer_id(*)
        `)
        .eq('id', id)
        .single()

      return device
    },

    getUser: async (_, args) => {
      const { email } = args
      console.log('🔍 GraphQL getUser called with email:', email)
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
        
      if (error) {
        console.log('❌ GraphQL getUser error:', error)
        return null
      }
      
      console.log('✅ GraphQL getUser found user:', user ? 'Yes' : 'No')
      if (user) {
        console.log('✅ User isAdmin:', user.isAdmin)
        console.log('✅ User adminRights:', user.adminRights)
      }
      
      return user
    },

    getVariants: async (_, args) => {
      const { data: variants } = await supabase
        .from('variants')
        .select('*')
        .eq('removed', false)
        .order('created_at', { ascending: false })
      return variants
    },

    // getVariant: async (_, { id }) => {
    //   const variant = await Variant.findById(id);

    //   return variant;
    // },

    getVariant: async (_, { id }) => {
      const { data: variant } = await supabase
        .from('variants')
        .select('*')
        .eq('id', id)
        .single()

      const { data: devices } = await supabase
        .from('devices')
        .select('*')
        .eq('variant_id', id)
        .eq('status', 'Available')

      variant.colors = variant?.colors?.map((color) => {
        const availableStorages = variant?.storages
          .filter((storage) =>
            devices.some(
              (device) =>
                String(device?.color) === String(color?._id) &&
                String(device?.storage) === String(storage?._id)
            )
          )
          .map((storage) => storage?.label)

        return {
          ...omit(color, ["_id"]),
          availableStorages,
          id: color?._id,
        }
      })

      variant.storages = variant?.storages?.map((storage) => {
        const availableColors = variant?.colors
          .filter((color) => {
            return devices.some((device) => {
              return (
                String(device?.color) === String(color?.id) &&
                String(device?.storage) === String(storage?._id)
              )
            })
          })
          .map((color) => color?.label)

        return {
          ...omit(storage, ["_id"]),
          availableColors,
          id: storage?._id,
        }
      })

      return variant
    },

    getDevices: async (_, args) => {
      const { data: devices } = await supabase
        .from('devices')
        .select(`
          *,
          offers:offer_id(*)
        `)
        .eq('status', 'Available')
        .order('created_at', { ascending: false })
      return devices
    },

    getBuyBacks: async (_, args) => {
      const buybacks = await BuyBack.find({})
        .sort({
          createdAt: -1,
        })
        .populate("variant")
        .populate("user")
      return buybacks
    },

    getOffers: async (_, args) => {
      let offers = await Offer.find({})

      let _offers = []

      for (let i = 0; i < offers?.length; i++) {
        let info = {
          id: offers[i]?.id,
          label: offers[i]?.label,
          start: offers[i]?.start,
          end: offers[i]?.end,
          createdBy: await User.findById(offers[i]?.createdBy),
          createdAt: offers[i]?.createdAt,
        }

        let devices = await Device.find({ "offer.info": offers[i]?.id })

        _offers.push({
          info,
          devices,
        })
      }

      return _offers
    },

    getSuggestions: async (_, { brand }) => {
      const { data: variants } = await supabase
        .from('variants')
        .select('*')
        .eq('brand', brand)
        .order('created_at', { ascending: false })
        .limit(10)

      return variants
    },

    getCarousels: async (_, args) => {
      const carousels = await Carousel.find().populate("createdBy")
      return carousels
    },

    getRunningOffers: async (_, args) => {
      const now = new Date().getTime()

      let offers = (await Offer.find({})).filter(
        (offer) =>
          now > new Date(parseInt(offer?.start)) &&
          now < new Date(parseInt(offer.end)).getTime()
      )

      let runningOffers = []

      for (let i = 0; i < offers?.length; i++) {
        let info = {
          id: offers[i]?.id,
          label: offers[i]?.label,
          start: offers[i]?.start,
          end: offers[i]?.end,
          createdBy: await User.findById(offers[i]?.createdBy),
          createdAt: offers[i]?.createdAt,
        }

        let devices = await Device.find({ "offer.info": offers[i]?.id })

        runningOffers.push({
          info,
          devices,
        })
      }

      return runningOffers
    },

    // getLanding: async (_, args) => {
    //   const now = new Date().getTime()

    //   const getRunningOffers = async () => {
    //     let offers = (await Offer.find({})).filter(
    //       (offer) =>
    //         now > new Date(parseInt(offer?.start)) &&
    //         now < new Date(parseInt(offer.end)).getTime()
    //     )

    //     let runningOffers = []

    //     for (let i = 0; i < offers?.length; i++) {
    //       let info = {
    //         id: offers[i]?.id,
    //         label: offers[i]?.label,
    //         start: offers[i]?.start,
    //         end: offers[i]?.end,
    //         createdBy: await User.findById(offers[i]?.createdBy),
    //         createdAt: offers[i]?.createdAt,
    //       }

    //       let devices = await Device.find({ "offer.info": offers[i]?.id })

    //       runningOffers.push({
    //         info,
    //         devices,
    //       })
    //     }

    //     return runningOffers
    //   }

    //   const getBestSellers = async () => {
    //     const modelSales = {}

    //     // Get the date 30 days ago
    //     const thirtyDaysAgo = new Date()
    //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    //     thirtyDaysAgo.setHours(0, 0, 0, 0)

    //     // Fetch devices sold in the last 30 days
    //     const orders = await Order.find({
    //       "saleInfo.payment.timestamp": { $exists: true },
    //       device: { $exists: true },
    //     }).populate("device") // Get brand data from Variant

    //     // Sequentially process each device
    //     for (let i = 0; i < orders.length; i++) {
    //       const order = orders[i]
    //       const saleDate = new Date(parseInt(order.saleInfo.payment.timestamp))
    //       if (saleDate < thirtyDaysAgo) continue // Skip if the sale is older than 30 days

    //       // Fetch variant and model for the device
    //       const variant = await Variant.findById(order?.device?.variant)
    //       const model = variant?.model

    //       if (!modelSales[model]) {
    //         modelSales[model] = 0
    //       }

    //       modelSales[model] += 1
    //     }

    //     // Convert to array and sort in descending order of sales
    //     const sortedSales = Object.entries(modelSales)
    //       .map(([model, sales]) => ({ model, sales }))
    //       .sort((a, b) => b.sales - a.sales)

    //     console.log(sortedSales)

    //     let variants = []

    //     for (let sale of sortedSales) {
    //       variants.push(await Variant.findOne({ model: sale?.model }))
    //     }

    //     // Return sorted best sellers
    //     return variants
    //   }

    //   const getCarousels = async () => {
    //     const carousels = await Carousel.find().populate("createdBy")
    //     return carousels
    //   }

    //   let landing = {
    //     runningOffers: await getRunningOffers(),
    //     bestSellers: await getBestSellers(),
    //     carousels: await getCarousels(),
    //   }

    //   return landing
    // },

    getRepairs: async (_, args) => {
      const repairs = await Repair.find({})
        .populate("device")
        .sort({ createdAt: -1 })
      return repairs
    },

    getCustomers: async (_, args) => {
      const { data: customers } = await supabase
        .from('users')
        .select('*')
      return customers
    },

    getSales: async (_, args) => {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          variants:variant_id(*),
          users:saleInfo->customer(*)
        `)
        .not('device_id', 'is', null)
        .order('created_at', { ascending: false })
        .populate("device")

      let sales = []

      for (let i = 0; i < orders?.length; i++) {
        let repair = await Repair.findOne({ device: orders[i]?.device?.id })

        const repairCost = () => {
          let cost =
            repair?.partsBought?.reduce((a, o) => {
              return a + o?.cost
            }, 0) + repair?.serviceCost

          if (cost) return cost
          return 0
        }
        console.log(orders[i]?.device)

        const variant = await Variant.findById(orders[i]?.device?.variant)

        let margin =
          orders[i]?.saleInfo?.payment?.amount -
          repairCost() -
          orders[i]?.device?.buyBackPrice

        sales.push({
          variant: variant?.model,
          color: variant?.colors?.find(
            ({ id }) => id == orders[i]?.device?.color
          )?.label,
          storage: variant?.storages?.find(
            ({ id }) => id == orders[i]?.device?.storage
          )?.label,
          imei: orders[i]?.device?.imei,
          serialNo: orders[i]?.device?.serialNo,
          purchasePrice: orders[i]?.device?.buyBackPrice,
          salePrice: orders[i]?.saleInfo?.payment?.amount,
          repairCost,
          saleDate: orders[i]?.saleInfo?.payment?.timestamp,
          customerName:
            orders[i]?.saleInfo?.customer?.name ||
            orders[i]?.saleInfo?.customerName,
          customerPhoneNumber: orders[i]?.saleInfo?.customerPhoneNumber
            ? "+254" + orders[i]?.saleInfo?.customerPhoneNumber
            : orders[i]?.saleInfo?.customer?.phoneNumber,
          margin,
          financer: orders[i]?.saleInfo?.payment?.financing,
          saleVia: orders[i]?.saleInfo?.saleVia,
          recordedBy: await User.findById(orders[i]?.saleInfo?.recordedBy),
        })
      }

      return sales
    },

    getAdmins: async (_, args) => {
      const { data: admins } = await supabase
        .from('users')
        .select('*')
        .eq('isAdmin', true)

      return admins
    },

    getCustomerInfoAdmin: async (_, { id }) => {
      // Fetch all non-admin customers with their carts
      const { data: customer } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      // Helper function to fetch purchases for a specific customer
      const getPurchases = async (customerId) => {
        const devices = await Device.find({
          saleInfo: { $ne: null },
          "saleInfo.customer": customerId,
        })
          .populate("variant")
          .populate("saleInfo.customer")

        return Promise.all(
          devices.map(async (device) => {
            // Fetch repair details for the device
            const repair = await Repair.findOne({ device: device.id })

            // Calculate repair cost
            const repairCost = repair
              ? repair.partsBought?.reduce((sum, part) => sum + part.cost, 0) +
                repair.serviceCost
              : 0

            // Calculate margin
            const margin =
              device.saleInfo.payment.amount - repairCost - device.buyBackPrice

            // Return purchase details
            return {
              variant: `${device.variant.brand} ${device.variant.model}`,
              color: device.color,
              storage: device.storage,
              imei: device.imei,
              serialNo: device.serialNo,
              purchasePrice: device.buyBackPrice,
              salePrice: device.saleInfo.payment.amount,
              repairCost,
              saleDate: device.saleInfo.payment.timestamp,
              customerName:
                device.saleInfo.customer?.name || device.saleInfo.customerName,
              customerPhoneNumber: device.saleInfo.customerPhoneNumber
                ? `+254${device.saleInfo.customerPhoneNumber}`
                : device.saleInfo.payment.phoneNumber,
              margin,
              financer: device.saleInfo.payment.financing,
              saleVia: device.saleInfo.saleVia,
              recordedBy: await User.findById(device.saleInfo.recordedBy),
            }
          })
        )
      }

      // Helper function to fetch financing requests for a specific customer
      const getFinancingRequests = async (customerId) => {
        const devices = await Device.find({
          financingRequests: {
            $elemMatch: { customer: customerId },
          },
        })
          .populate("variant")
          .populate("offer.info")
          .populate("financingRequests.customer")

        return devices.flatMap((device) => {
          const offer = device.offer?.info
          const now = Date.now()

          // Helper functions to calculate prices
          const calculatePrice = () => {
            if (
              offer &&
              new Date(offer.start).getTime() < now &&
              new Date(offer.end).getTime() > now
            ) {
              if (device.offer.reduction === "by_price") {
                return device.price - offer.value
              } else if (device.offer.reduction === "by_percentage") {
                return (device.price * (100 - offer.value)) / 100
              }
            }
            return device.price
          }

          const slashedPrice = () => {
            if (
              offer &&
              new Date(offer.start).getTime() < now &&
              new Date(offer.end).getTime() > now
            ) {
              return device.price
            }
            return null
          }

          // Map financing requests for the customer
          return device.financingRequests
            .filter(
              (request) => String(request.customer) === String(customerId)
            )
            .map((request) => ({
              device: {
                images: device.images,
                currentPrice: calculatePrice(),
                slashedPrice: slashedPrice(),
                brand: device.variant.brand,
                model: device.variant.model,
                storage: device.storage,
                color: device.color,
                description: device.description,
                technicalInfo: device.variant.technicalSpecifications,
                comesWith: device.comesWith,
                financing: device.variant.financing,
                imei: device.imei,
                serialNo: device.serialNo,
              },
              financer: request.financer,
              status: request.status,
              date: request.date,
              customer: request.customer, // Populated customer object
            }))
        })
      }

      const purchases = await getPurchases(customer.id)
      const financingRequests = await getFinancingRequests(customer.id)

      return {
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
        cart: customer.cart,
        purchases,
        financingRequests,
      }
    },
  },

  Mutation: {
    updateBlog: async (_, { id, content, category, thumbnail, title }) => {
      const blog = await Blog.findByIdAndUpdate(
        id,
        { content, category, thumbnail, title },
        { new: true }
      )

      return blog
    },

    addBlog: async (_, { content, category, thumbnail, title, createdBy }) => {
      const newBlog = new Blog({
        title,
        thumbnail,
        category,
        content,
        createdBy,
      })

      await newBlog.save()

      return newBlog
    },

    removeBlog: async (_, { id }) => {
      const blog = await Blog.findByIdAndDelete(id)
      return blog
    },

    addTechTip: async (_, { link, createdBy }) => {
      const newTechTip = new TechTip({
        link,
        createdBy,
      })

      await newTechTip.save()

      return newTechTip
    },

    deleteTechTip: async (_, { id }) => {
      const techTip = await TechTip.findByIdAndDelete(id)
      return techTip
    },

    addTechTip: async (_, { link, createdBy }) => {
      let techTip = new TechTip({
        link,
        createdBy,
      })

      await techTip.save()

      return techTip
    },
    updateReview: async (_, { reviewId, featured, removed }) => {
      let update = {}

      if (featured !== undefined) update["review.featured"] = featured
      if (removed !== undefined) update["review.removed"] = removed

      const order = await Order.findOneAndUpdate(
        { "review._id": reviewId },
        { $set: update },
        { new: true }
      )

      let review = {
        id: order?.review?.id,
        rating: order?.review?.rating,
        review: order?.review?.review,
        image: order?.review?.image,
        date: order?.review?.date,
        customer: await User.findById(order?.saleInfo?.customer),
        product: await Variant.findById(order?.variant),
        featured: order?.review?.featured,
      }

      return review
    },

    saveReview: async (_, { review, rating, image, orderId }) => {
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          review: {
            review,
            rating,
            image,
            date: new Date().toISOString(),
          },
        },
        { new: true }
      )

      const user = await User.findById(updatedOrder.saleInfo.customer)

      return user
    },

    sendMail: async () => {
      const APP_PASSWORD = "scfb ubpa pcbo jdpo"

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "s2kinyanjui@gmail.com",
          pass: APP_PASSWORD,
        },
      })

      const html = `
      <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exclusive Device Offer</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      padding: 20px;
      border: 1px solid #dddddd;
      border-radius: 8px;
    }
    .header {
      text-align: center;
      color: #333333;
    }
    .product-image {
      width: 100%;
      max-height: 300px;
      object-fit: cover;
      border-radius: 8px;
    }
    .price {
      color: #ff4d4f;
      font-size: 24px;
      font-weight: bold;
    }
    .slashed-price {
      color: #999999;
      text-decoration: line-through;
      margin-left: 10px;
      font-size: 18px;
    }
    .cta-button {
      display: inline-block;
      background-color: #28a745;
      color: #ffffff;
      padding: 5px 20px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
      font-size: 18px;
    }
    .cta-button:hover {
      background-color: #218838;
    }
    .validity {
      color: #666666;
      font-size: 14px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2 class="header">🔥 Exclusive Offer on this Latest Device! 🔥</h2>
    <img class="product-image" src="https://via.placeholder.com/600x300" alt="Device Image">
    <h3>Amazing Device Name</h3>
    <p class="price">$299 <span class="slashed-price">$399</span></p>
    <p>Don't miss out on this limited-time offer! Get the latest device at a discounted price.</p>
    <a href="https://example.com" class="cta-button">Buy Now</a>
    <p class="validity">Offer valid from <strong>Feb 25, 2025</strong> to <strong>Mar 10, 2025</strong></p>
  </div>
</body>
</html>
`

      transporter
        .sendMail({
          to: "s2kinyanjui@gmail.com, s2kinyanjui@oligarch.co.ke",
          subject: "My subject",
          html,
        })
        .then(() => console.log("Hey there"))
        .catch(console.log)
    },

    addMailing: async (_, { email }) => {
      const result = await Mailing.findOneAndUpdate(
        { email },
        { $setOnInsert: { email } },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      )

      return result
    },

    createRepair: async (_, args) => {
      const {
        repairType,
        dateBrought,
        defects,
        imei,
        variant,
        serialNo,
        customerName,
        customerPhoneNumber,
      } = args

      let update = {}

      let deviceId = (await Device.findOne({ imei }))?._id || null

      if (customerName) update["customer.name"] = customerName
      if (customerPhoneNumber)
        update["customer.phoneNumber"] = customerPhoneNumber
      if (deviceId) update["device"] = deviceId

      const newRepair = new Repair({
        repairType,
        dateBrought,
        defects,
        imei,
        variant,
        serialNo,
        ...update,
      })

      const repair = await newRepair.save()
      return repair
    },

    completeVerification: async (_, { id, otp }) => {
      console.log('Verifying OTP for user ID:', id, 'OTP:', otp)
      
      let userId = id
      let user
      
      // Get the user and check their stored OTP
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('verificationToken, phoneVerified')
        .eq('id', id)
        .single()
        
      console.log('User verification data:', { user: userData, fetchError })
      
      if (fetchError || !userData) {
        console.log('Error fetching user with ID:', id, 'Error:', fetchError)
        return null
      } else {
        user = userData
      }
      
      // Check if OTP matches
      if (user.verificationToken !== otp) {
        console.log('OTP mismatch. Expected:', user.verificationToken, 'Got:', otp)
        return null
      }
      
      // OTP is correct, mark phone as verified and clear the token
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          phoneVerified: true, 
          verificationToken: null // Clear the token after successful verification
        })
        .eq('id', userId)
        .select()
        .single()
        
      console.log('Verification result:', { updatedUser, updateError })
      
      if (updateError) {
        console.log('Error verifying phone:', updateError)
        return null
      }
      
      return updatedUser
    },

    sendSMS: async () => {
      const options = {
        to: ["+254732283351"],
        message: "This is Kinuthia testing stuff",
      }

      // // Send message and capture the response or error
      // sms
      //   .send(options)
      //   .then(({ SMSMessageData }) => {
      //     console.log(SMSMessageData?.Recipients);
      //   })
      //   .catch((error) => {
      //     console.log(error);
      //   });

      const { responses } = await sendText("+254748920306", "Send Via code 3")
      const isSuccess = responses[0]["response-code"] == 200 ? true : false
      console.log(isSuccess)

      return "Done"
    },

    removeFromOffer: async (_, { id }) => {
      const updatedDevice = await Device.findByIdAndUpdate(
        id,
        { $unset: { offer: "" } }, // Clears the entire `offer` field
        { new: true } // Returns the updated document
      )

      return updatedDevice
    },

    createCarousel: async (_, args) => {
      const { smallScreen, largeScreen, link, createdBy } = args

      const newCarousel = new Carousel({
        smallScreen,
        largeScreen,
        link,
        createdBy,
      })

      const carousel = await newCarousel.save()

      return carousel
    },

    removeCarousel: async (_, { id }) => {
      const carousel = await Carousel.findByIdAndDelete(id)

      return carousel
    },

    addAdmin: async (_, { id }) => {
      const { data: admin } = await supabase
        .from('users')
        .update({ isAdmin: true })
        .eq('id', id)
        .select()
        .single()

      return admin
    },

    removeAdmin: async (_, { id }) => {
      const { data: admin } = await supabase
        .from('users')
        .update({ isAdmin: false })
        .eq('id', id)
        .select()
        .single()

      return admin
    },

    editRights: async (_, args) => {
      const { rights, id, changedBy } = args

      const { data: admin } = await supabase
        .from('users')
        .update({
          adminRights: rights,
          rulesSetBy: changedBy,
        })
        .eq('id', id)
        .select()
        .single()

      return admin
    },

    createFinancingRequest: async (_, args) => {
      const { cart, customer, financer } = args

      const variants = JSON.parse(cart)

      for (let i = 0; i < variants?.length; i++) {
        const newFinanceRequest = new FinanceRequest({
          customer,
          date: new Date().getTime().toString(),
          financer,
          status: "PROCESSING",
          variant: variants[i]?.variant,
          color: variants[i]?.color,
          storage: variants[i]?.storage,
        })

        await newFinanceRequest.save()
      }

      const { data: user } = await supabase
        .from('users')
        .update({
          cart: [],
        })
        .eq('id', customer)
        .select()
        .single()

      await sendText(
        user?.phoneNumber,
        "We have received your financing request. Please wait as one of our staff processes your request. Thank you."
      )

      return user
    },

    editProfile: async (_, args) => {
      const { name, phoneNumber, id } = args

      const updateFields = {}
      if (name) updateFields["name"] = name
      if (phoneNumber) {
        updateFields["phoneNumber"] = phoneNumber
        updateFields["phoneVerified"] = false
      }

      // Try to find user by ID first, then by email if ID doesn't work
      let { data: user, error } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single()

      // If user not found by ID, try by email (in case ID is actually an email)
      if (error && id.includes('@')) {
        const { data: userByEmail, error: emailError } = await supabase
          .from('users')
          .update(updateFields)
          .eq('email', id)
          .select()
          .single()
        
        if (!emailError) {
          user = userByEmail
        }
      }

      return user
    },

    sendVerificationToken: async (_, { id }) => {
      console.log('Looking for user with ID:', id)
      
      let phoneNumber, userId
      
      // Get user from Supabase instead of MongoDB
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('phoneNumber')
        .eq('id', id)
        .single()

      if (userError || !user) {
        console.log('User not found with ID:', id, 'Error:', userError)
        return "NO_USER"
      } else {
        phoneNumber = user.phoneNumber
        userId = id
      }

      if (!phoneNumber) {
        console.log('No phone number found for user')
        return "NO_PHONE"
      }

      // Generate 4-digit OTP
      let digits = "0123456789"
      let OTP = ""

      for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)]
      }

      // Store OTP in the verificationToken column
      console.log('Storing OTP for user ID:', userId, 'OTP:', OTP)
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ verificationToken: OTP })
        .eq('id', userId)
        .select()
        .single()

      console.log('OTP storage result:', { updatedUser, updateError })
      
      if (updateError) {
        console.log('Error storing OTP:', updateError)
        return "UPDATE_ERROR"
      }

      try {
        // Send SMS using the existing sendText function
        console.log(`Sending SMS to ${phoneNumber} with OTP: ${OTP}`)
        const result = await sendText(
          phoneNumber,
          `Your OTP verification is ${OTP}`
        )
        
        console.log('SMS send result:', result)
        
        // Check if SMS was sent successfully
        if (result && result.responses && result.responses[0]) {
          const isSuccess = result.responses[0]["response-code"] == 200
          console.log('SMS success:', isSuccess)
          return isSuccess ? "OK" : "SMS_FAILED"
        } else {
          console.log('SMS failed - no response data')
          return "SMS_FAILED"
        }
      } catch (error) {
        console.log('SMS error:', error)
        return "SMS_ERROR"
      }
    },

    collectOrder: async (_, args) => {
      const { orderId } = args

      let update = {}
      update["saleInfo.delivery.collectionTime"] = new Date()
        .getTime()
        .toString()

      let order = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: update,
        },
        { new: true }
      )

      return order
    },

    dispatchOrder: async (_, args) => {
      const { deviceId, orderId } = args

      let update = {}
      update["saleInfo.delivery.dispatchTime"] = new Date().getTime().toString()
      update["device"] = deviceId

      let order = await Order?.findByIdAndUpdate(
        orderId,
        { $set: update },
        { new: true }
      ).populate("saleInfo.customer")

      console.log(order)

      let device = await Device?.findByIdAndUpdate(
        deviceId,
        { status: "Sold" },
        { new: true }
      ).populate("variant")

      const storage = device?.variant?.storages?.find(
        ({ id }) => id == order?.storage
      )?.label
      const color = device?.variant?.colors?.find(
        ({ id }) => id == order?.color
      )?.label

      console.log(order?.saleInfo?.customer)

      await sendText(
        order?.saleInfo?.customer?.phoneNumber,
        `Order dispatched. Your order of ${device?.variant?.model}-${storage}-${color} is on the way to you. Thank you for trusting us.`
      )

      return order

      // sms
      //   .send({
      //     to: [device?.saleInfo?.customer?.phoneNumber],
      //     message: `Order dispatched. Your order of ${device?.variant?.model}-${device?.storage}-${device?.color} is on the way to you. Thank you for trusting us `,
      //   })
      //   .then(({ SMSMessageData }) => {
      //     console.log(SMSMessageData?.Recipients);
      //   })
      //   .catch((error) => {
      //     console.log(error);
      //   });

      return device
    },

    orderCollected: async (_, args) => {
      const { deviceId } = args

      let update = {}
      update["saleInfo.delivery.collectionTime"] = new Date()
        .getTime()
        .toString()

      let device = await Device.findByIdAndUpdate(
        deviceId,
        {
          $set: update,
        },
        { new: true }
      )
        .populate("saleInfo.customer")
        .populate("variant")

      return device
    },

    // recordSale: async (_, args) => {
    //   const {
    //     saleVia,
    //     paymentMode,
    //     paymentTimestamp,
    //     paymentCode,
    //     customerId,
    //     customerName,
    //     customerPhonenumber,
    //     customerEmail,
    //     lat,
    //     lng,
    //     paymentPhoneNumber,
    //   } = args

    //   let updateFields = {}
    //   if (saleVia) updateFields["saleInfo.saleVia"] = saleVia
    //   if (paymentMode) updateFields["saleInfo.payment.mode"] = paymentMode
    //   if (paymentCode) updateFields["saleInfo.payment.codes"] = [paymentCode]

    //   if (paymentTimestamp)
    //     updateFields["saleInfo.payment.timestamp"] = paymentTimestamp

    //   if (lat) updateFields["saleInfo.delivery.lat"] = lat
    //   if (lng) updateFields["saleInfo.delivery.lng"] = lng
    //   if (customerId) updateFields["saleInfo.customer"] = customerId
    //   if (paymentPhoneNumber)
    //     updateFields["saleInfo.payment.phoneNumber"] = paymentPhoneNumber

    //   let newCustomer

    //   // Create a new customer if necessary
    //   if (!customerId) {
    //     const _newCustomer = new User({
    //       name: customerName,
    //       email: customerEmail,
    //       phoneNumber: customerPhonenumber,
    //     })
    //     newCustomer = await _newCustomer.save()
    //     updateFields["saleInfo.customer"] = newCustomer?.id
    //   }

    //   // Create orders
    //   const cartItems = (
    //     await User.findById(customerId)
    //       .populate("cart.variant")
    //       .populate("cart.device")
    //   )?.cart

    //   const createdOrders = []
    //   let orderSummary = ""

    //   for (const cartItem of cartItems) {
    //     if (!cartItem?.device) {
    //       const variant = cartItem?.variant
    //       const storage = variant?.storages?.find(
    //         (storage) => storage["id"] == cartItem?.storage
    //       )
    //       const color = variant?.colors?.find(
    //         (color) => color["id"] == cartItem?.color
    //       )

    //       orderSummary += `${variant?.model} - ${storage?.label} - ${color?.label}\n`

    //       updateFields["saleInfo.payment.amount"] = storage?.price

    //       const newOrder = new Order({
    //         ...updateFields,
    //         variant: variant?.id,
    //         storage: cartItem?.storage,
    //         color: cartItem?.color,
    //       })

    //       const savedOrder = await newOrder.save()
    //       createdOrders.push(savedOrder)
    //     } else if (cartItem?.device) {
    //       updateFields["saleInfo.payment.amount"] =
    //         cartItem?.device?.offer?.price

    //       const newOrder = new Order({
    //         ...updateFields,
    //         device: cartItem?.device?.id,
    //         storage: cartItem?.device?.storage,
    //         color: cartItem?.device?.color,
    //         variant: cartItem?.device?.variant,
    //       })

    //       await Device.findByIdAndUpdate(
    //         cartItem?.device?.id,
    //         { status: "Sold" },
    //         { new: true }
    //       )

    //       orderSummary += `${cartItem?.device?.model} - ${cartItem?.device?.storage} - ${cartItem?.device?.color}\n`

    //       const savedOrder = await newOrder.save()
    //       createdOrders.push(savedOrder)
    //     }
    //   }

    //   console.log(createdOrders)

    //   // Clear cart

    //   const updatedUser = await User.findOneAndUpdate(
    //     { _id: customerId },
    //     { $set: { cart: [] } },
    //     { new: true }
    //   )

    //   // Send text

    //   try {
    //     await sendText(
    //       updatedUser.phoneNumber,
    //       `Your order has been received and is being processed. You can track the order status from our website under the orders tab. Thank you for trusting us.`
    //     )

    //     for (let i of [
    //       "+254705820802",
    //       "+254728412853",
    //       "+254769731531",
    //       "+254743347459",
    //       "+254723772024",
    //       "+254748920306",
    //     ]) {
    //       await sendText(i, `New website order alert:\n${orderSummary}`)
    //     }

    //     return updatedUser
    //   } catch (error) {
    //     return updatedUser
    //   }
    // },

    setDeviceonOffer: async (_, args) => {
      const { offerId, deviceId, price } = args

      try {
        const adminNumbers = ["+254111404330", "+254748920306"]

        for (let number of adminNumbers) {
          await sendText(number, `New offer!!!!`)
        }
      } catch (error) {
        console.error("SMS sending failed:", error)
      }

      const device = await Device.findByIdAndUpdate(
        deviceId,
        {
          "offer.info": offerId,
          "offer.price": price,
        },
        { new: true }
      )
        .populate("variant")
        .populate("offer.info")

      const mailing = await Mailing.find()

      const primaryIndex =
        device?.variant?.colors?.find((color) => color?.id == device?.color)
          ?.primaryIndex || 0

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exclusive Device Offer</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: #f4f4f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      color: #001f3f;
      font-size: 20px;
    }
    .product-image {
      display: block;
      max-height: 250px;
      margin: 20px auto;
      object-fit: contain;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    .price {
      color: #ff4d4f;
      font-size: 28px;
      font-weight: bold;
      text-align: center;
    }
    .slashed-price {
      color: #999999;
      text-decoration: line-through;
      font-size: 18px;
      margin-left: 8px;
    }
    .description {
      text-align: center;
      color: #555555;
      font-size: 16px;
      line-height: 1.5;
      margin: 15px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #172554;
      text-decoration: none;
      color: #ffffff;
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 30px;
      font-size: 18px;
      box-shadow: 0 4px 6px rgba(0, 123, 255, 0.4);
      transition: background-color 0.3s ease;
    }

    .button-container {
      text-align: center;
      margin-top: 20px;
    }
    .validity {
      color: #777777;
      font-size: 14px;
      text-align: center;
      margin-top: 15px;
      font-style: italic;
    }
    .footer {
      text-align: center;
      color: #999999;
      font-size: 12px;
      margin-top: 20px;
    }
    .footer a {
      color: #999999;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2 class="header">🔥 Exclusive ${device?.offer?.info?.label} on this ${
        device?.variant?.model
      }! 🔥</h2>
      <br/>
    <img class="product-image" src="${
      device?.variant?.colors?.find((color) => color?.id == device?.color)
        ?.images[primaryIndex]
    }" alt="Device Image">
    <h3 style="text-align: center; color: #333333;">${
      device?.variant?.model
    } - ${
        device?.variant?.storages?.find(
          (storage) => storage?.id == device?.storage
        )?.label
      } - ${
        device?.variant?.colors?.find((color) => color?.id == device?.color)
          ?.label
      } </h3>
    <p class="price">Ksh. ${device?.offer?.price?.toLocaleString("en-US")} 
      <span class="slashed-price">Ksh. ${device?.variant?.storages
        ?.find((storage) => storage?.id == device?.storage)
        ?.price?.toLocaleString("en-US")}</span>
    </p>
    <p class="description">Don't miss out on this limited-time offer! Get the latest device at a discounted price and stay ahead with cutting-edge technology.</p>
    <div class="button-container">
<a href="https://shwariphones.africa/offer/${
        device?.id
      }" class="cta-button" style="color: white; text-decoration: none; padding: 5px 20px; display: inline-block;">
  Check it out
</a>
    </div>
    <p class="validity">Offer valid from <strong>${moment(
      new Date(parseInt(device?.offer?.info?.start))
    ).format("Do MMM YYYY")}</strong> to <strong>${moment(
        new Date(parseInt(device?.offer?.info?.end))
      ).format("Do MMM YYYY")}</strong></p>
    <div class="footer">
      <p>You're receiving this email because you signed up for Shwariphones' exclusive offers.</p>
   
    </div>
  </div>
</body>
</html>
`

      for (let to of mailing) {
        transporter
          .sendMail({
            to: to?.email,
            subject: `${device?.variant?.model} on offer!`,
            html,
          })
          .then(() => console.log("Hey there"))
          .catch(console.log)
      }

      return device
    },

    createOffer: async (_, args) => {
      const newOffer = new Offer({
        ...args,
      })
      let offer = await newOffer.save()
      return {
        info: {
          id: offer?.id,
          label: offer?.label,
          start: offer?.start,
          end: offer.end,
          createdBy: await User.findById(offer?.createdBy),
          createdAt: offer?.createdAt,
        },
        devices: [],
      }
    },

    createVariant: async (_, args) => {
      const {
        tradeInAllowed,
        deviceType,
        brand,
        model,
        technicalSpecifications,

        screenCost,
        bodyCost,
        frontCamCost,
        backCamCost,
        earpieceCost,
        mouthpieceCost,
        speakerCost,
        authCost,
        simTrayCost,
        motherBoardCost,
        batteryCost,

        colors,
        storages,
        financing,
      } = args

      const newVariant = new Variant({
        tradeInAllowed,
        deviceType,
        brand,
        model,
        technicalSpecifications: JSON.parse(technicalSpecifications),

        screenCost,
        bodyCost,
        frontCamCost,
        backCamCost,
        earpieceCost,
        mouthpieceCost,
        speakerCost,
        authCost,
        simTrayCost,
        motherBoardCost,
        batteryCost,

        colors: JSON.parse(colors),
        storages: JSON.parse(storages),
        financing,
      })

      let variant = await newVariant.save()

      // Variant.syncToAlgolia()

      return variant
    },

    createDevice: async (_, args) => {
      const {
        imei,
        variant,
        storage,
        color,
        metadata,
        serial,
        buyBackPrice,
        grade,
      } = args

      let _metaData = JSON.parse(metadata)

      const newDevice = new Device({
        imei,
        variant,
        storage,
        color,
        serialNo: serial,
        metadata: _metaData,
        buyBackPrice,
        grade,
      })

      const device = await newDevice.save()

      if (_metaData?.sourceDefects?.length > 0) {
        const newRepair = new Repair({
          device: device?.id,
          repairType: "refurb_stock",
          dateBrought: new Date().getTime().toString(),
        })
        await newRepair.save()
      }

      return device
    },

    editDevice: async (_, args) => {
      const {
        id,
        imei,
        variant,
        storage,
        color,
        metadata,
        serial,
        buyBackPrice,
        grade,
      } = args

      let _metaData = JSON.parse(metadata)

      const device = await Device.findByIdAndUpdate(
        id,
        {
          imei,
          variant,
          storage,
          color,
          metadata: _metaData,
          serialNo: serial,
          buyBackPrice,
          grade,
        },
        { new: true }
      )

      return device
    },

    addToCart: async (_, args) => {
      const { email, variant, storage, color, device } = args

      // Get current user
      const { data: currentUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      let cartItem
      if (!device) {
        cartItem = {
          variant,
          storage,
          color,
        }
      } else {
        cartItem = {
          device,
        }
      }

      // Add item to cart
      const updatedCart = [...(currentUser.cart || []), cartItem]
      
      const { data: user } = await supabase
        .from('users')
        .update({ cart: updatedCart })
        .eq('email', email)
        .select()
        .single()

      return user
    },

    removeFromCart: async (_, args) => {
      const { email, id } = args

      // Get current user
      const { data: currentUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      // Remove item from cart
      const updatedCart = (currentUser.cart || []).filter(item => item._id !== id)
      
      const { data: user } = await supabase
        .from('users')
        .update({ cart: updatedCart })
        .eq('email', email)
        .select()
        .single()

      return user
    },

    editShipping: async (_, args) => {
      const { id, building, suite, street, town } = args

      const updateFields = {}
      if (building) updateFields["shipping.building"] = building
      if (suite) updateFields["shipping.suite"] = suite
      if (street) updateFields["shipping.street"] = street
      if (town) updateFields["shipping.town"] = town

      const { data: user } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single()

      return user
    },

    createBuyBack: async (_, args) => {
      const {
        email,
        model,
        storage,
        batteryHealth,
        frontCamOk,
        backCamOk,
        earpieceOk,
        mouthpieceOk,
        speakerOk,
        authorizationOk,
        simTrayPresent,
        chargingOk,
        screenCondition,
        sideNBackCondition,
        offer,
      } = args

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      const { data: newBuyBack } = await supabase
        .from('buybacks')
        .insert({
          user_id: user?.id,
          variant_id: model,
          storage,
        batteryHealth,
        frontCamOk,
        backCamOk,
        earpieceOk,
        mouthpieceOk,
        speakerOk,
        authorizationOk,
        simTrayPresent,
        chargingOk,
        screenCondition,
        sideNBackCondition,
        offer,
      })

      let buyBack = await newBuyBack.save()

      const { responses } = await sendText(
        user?.phoneNumber,
        `We have received your trade in request. Please wait as one of our staff processes your request.Thank you.`
      )
      const isSuccess = responses[0]["response-code"] == 200 ? true : false
      console.log(isSuccess)

      // sms
      //   .send({
      //     to: [user.phoneNumber],
      //     message: `We have received your trade in request. Please wait as one of our staff processes your request.Thank you.`,
      //   })
      //   .then(({ SMSMessageData }) => {
      //     console.log(SMSMessageData?.Recipients);
      //   })
      //   .catch((error) => {
      //     console.log(error);
      //   });

      return buyBack
    },

    removeVariant: async (_, { id }) => {
      const variant = await Variant.findByIdAndUpdate(
        id,
        { removed: true },
        { new: true }
      )
      return variant
    },

    updateVariant: async (_, args) => {
      const {
        id,
        tradeInAllowed,
        deviceType,
        brand,
        model,
        technicalSpecifications,

        screenCost,
        bodyCost,
        frontCamCost,
        backCamCost,
        earpieceCost,
        mouthpieceCost,
        speakerCost,
        authCost,
        simTrayCost,
        motherBoardCost,
        batteryCost,
        colors,
        storages,

        financing,
        featured,
      } = args

      console.log(JSON.parse(colors))

      const _colors = JSON.parse(colors)?.map((color) => ({
        ...omit(color, ["id"]),
        _id: color?.id,
      }))

      const _storages = JSON.parse(storages)?.map((storage) => ({
        ...omit(storage, ["id"]),
        _id: storage?.id,
      }))

      const variant = await Variant.findByIdAndUpdate(
        id,
        {
          tradeInAllowed,
          deviceType,
          brand,
          model,
          technicalSpecifications: JSON.parse(technicalSpecifications),

          screenCost,
          bodyCost,
          frontCamCost,
          backCamCost,
          earpieceCost,
          mouthpieceCost,
          speakerCost,
          authCost,
          simTrayCost,
          motherBoardCost,
          batteryCost,
          colors: _colors,
          storages: _storages,

          financing,
          featured,
        },
        {
          new: true,
        }
      )

      // Variant.syncToAlgolia()

      return variant
    },

    updateRepair: async (_, args) => {
      const { id, partsBought, serviceCost, repairedBy, dateFixed } = args

      const repair = await Repair.findByIdAndUpdate(
        id,
        {
          partsBought: JSON.parse(partsBought),
          serviceCost,
          repairedBy,
          dateFixed,
        },
        { new: true }
      )
      return repair
    },

    updateBuyBack: async (_, args) => {
      const {
        cancel,
        id,
        variant,
        storage,
        batteryHealth,
        frontCamOk,
        backCamOk,
        earpieceOk,
        mouthPieceOk,
        speakerOk,
        authorizationOk,
        simTrayPresent,
        chargingOk,
        screenCondition,
        sideNBackCondition,
        offer,
      } = args

      let update = {}

      if (variant) update["variant"] = variant
      if (storage) update["storage"] = storage
      if (screenCondition) update["screenCondition"] = screenCondition
      if (sideNBackCondition) update["sideNBackCondition"] = sideNBackCondition
      if (batteryHealth) update["batteryHealth"] = batteryHealth
      if (frontCamOk) update["frontCamOk"] = frontCamOk
      if (backCamOk) update["backCamOk"] = backCamOk
      if (earpieceOk) update["earpieceOk"] = earpieceOk
      if (mouthPieceOk) update["mouthPieceOk"] = mouthPieceOk
      if (speakerOk) update["speakerOk"] = speakerOk
      if (authorizationOk) update["authorizationOk"] = authorizationOk
      if (simTrayPresent) update["simTrayPresent"] = simTrayPresent
      if (chargingOk) update["chargingOk"] = chargingOk
      if (cancel) update["cancelled"] = true
      if (offer) update["offer"] = offer

      const buyBack = await BuyBack.findByIdAndUpdate(id, update, {
        new: true,
      })

      // if (status !== "cancelled") {
      //   const newDevice = new Device({
      //     serialNo,
      //     imei,
      //     variant,
      //     publicAvailability: false,
      //     storage,
      //     color,
      //     metadata: {
      //       sourceType: "BuyBack",
      //       sourceName: `${buyBack?.user?.name} - ${buyBack?.user?.phoneNumber}`,
      //       sourceDefects: defects,
      //       purchaseDate: new Date().getTime().toString(),
      //     },
      //     buyBackPrice: offer,
      //     grade,
      //   });

      //   let device = await newDevice.save();

      //   if (defects?.length > 0) {
      //     const newRepair = new Repair({
      //       device: device?.id,
      //       repairType: "refurb_stock",
      //       dateBrought: new Date().getTime().toString(),
      //     });
      //     await newRepair.save();

      //     return;
      //   }
      // }

      return buyBack
    },

    completeBuyback: async (_, args) => {
      const {
        id,
        variant,
        color,
        storage,
        batteryHealth,
        frontCamOk,
        backCamOk,
        earpieceOk,
        mouthpieceOk,
        speakerOk,
        authorizationOk,
        simTrayPresent,
        chargingOk,
        screenCondition,
        sideNBackCondition,
        offer,
        defects,
        imei,
        serialNo,
        grade,
        customerName,
        customerPhone,
      } = args

      let update = {}

      if (variant) update["variant"] = variant
      if (storage) update["storage"] = storage
      if (screenCondition) update["screenCondition"] = screenCondition
      if (sideNBackCondition) update["sideNBackCondition"] = sideNBackCondition
      if (batteryHealth) update["batteryHealth"] = batteryHealth
      if (frontCamOk) update["frontCamOk"] = frontCamOk
      if (backCamOk) update["backCamOk"] = backCamOk
      if (earpieceOk) update["earpieceOk"] = earpieceOk
      if (mouthpieceOk) update["mouthpieceOk"] = mouthpieceOk
      if (speakerOk) update["speakerOk"] = speakerOk
      if (authorizationOk) update["authorizationOk"] = authorizationOk
      if (simTrayPresent) update["simTrayPresent"] = simTrayPresent
      if (chargingOk) update["chargingOk"] = chargingOk
      if (offer) update["offer"] = offer
      update["payment.timestamp"] = new Date().getTime().toString()

      const buyBack = await BuyBack.findByIdAndUpdate(id, update, {
        new: true,
      })

      const newDevice = new Device({
        serialNo,
        imei,
        variant,
        storage,
        color,
        metadata: {
          sourceType: "BuyBack",
          sourceName: `${customerName} - ${customerPhone}`,
          sourceDefects: defects,
          purchaseDate: new Date().getTime().toString(),
        },
        buyBackPrice: offer,
        grade,
      })

      let device = await newDevice.save()

      if (defects?.length > 0) {
        const newRepair = new Repair({
          device: device?.id,
          repairType: "refurb_stock",
          dateBrought: new Date().getTime().toString(),
        })
        await newRepair.save()
      }

      return buyBack
    },

    sellDevice: async (_, args) => {
      const {
        deviceId,
        customerName,
        customerPhoneNumber,
        customerId,
        compliments,
        txCodes,
        sellPrice,
        financingOption,
        paymentMode,
        sellDate,

        variant,
        storage,
        color,
      } = args

      let update = {}

      if (customerName) update["saleInfo.customerName"] = customerName
      if (customerPhoneNumber)
        update["saleInfo.customerPhoneNumber"] = customerPhoneNumber
      if (customerId) update["saleInfo.customer"] = customerId
      if (compliments) update["saleInfo.compliments"] = compliments
      if (sellPrice) update["saleInfo.payment.amount"] = sellPrice
      if (sellDate)
        update["saleInfo.payment.timestamp"] =
          sellDate || new Date().getTime().toString()
      if (financingOption)
        update["saleInfo.payment.financing"] = financingOption
      if (txCodes) update["saleInfo.payment.codes"] = txCodes
      if (paymentMode) update["saleInfo.payment.mode"] = paymentMode
      update["saleInfo.saleVia"] = "walk in"

      const newOrder = new Order({
        ...update,
        device: deviceId,
        variant,
        storage,
        color,
      })

      const order = await newOrder.save()
      let device

      if (order) {
        device = await Device.findByIdAndUpdate(
          deviceId,
          { status: "Sold" },
          {
            new: true,
          }
        )
      }

      return device
    },

    toggleVisibility: async (_, args) => {
      const { id, images, price, description, compliments } = args

      const device = await Device.findByIdAndUpdate(
        id,
        {
          images,
          price,
          description,
          publicAvailability: true,
          comesWith: compliments,
        },
        { new: true }
      )

      return device
    },

    cancelFinancingRequest: async (_, { request: requestID }) => {
      const request = await FinanceRequest.findByIdAndUpdate(
        requestID,
        {
          status: "CANCELLED",
        },
        { new: true }
      ).populate("variant")

      let result = {
        device: {
          variant: request?.variant,
          storage: request?.storage,
          color: request?.color,
        },
        financer: request?.financer,
        status: request?.status,
        date: request?.date,
        customer: request?.customer,
      }

      return result
    },

    approveFinancingRequest: async (_, args) => {
      const { request: requestID, txCodes, paymentMode, amount } = args

      const _request = await FinanceRequest.findByIdAndUpdate(requestID, {
        status: "APPROVED",
      }).populate("variant")

      let newOrder = new Order({
        variant: _request?.variant?.id,
        storage: _request?.storage,
        color: _request?.color,
        saleInfo: {
          saleVia: "website",
          payment: {
            mode: paymentMode,
            amount: amount,
            timestamp: new Date().getTime().toString(),
            codes: txCodes,
            financing: _request?.financer,
          },
          customer: _request?.customer,
        },
      })

      await newOrder.save()

      return _request
    },

    featureVariant: async (_, { variant }) => {
      let newVariant = await Variant.findByIdAndUpdate(
        variant,
        {
          featured: true,
        },
        { new: true }
      )

      return newVariant
    },
  },
}

export default resolvers
