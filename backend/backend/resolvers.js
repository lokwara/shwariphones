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

      // Ensure cart is always an array
      if (!cart || !Array.isArray(cart)) {
        return []
      }

      let cartItems = []

      for (let i = 0; i < cart.length; i++) {
        const cartItem = cart[i]
        
        if (cartItem?.variant && !cartItem?.device) {
          // Variant-based cart item (general product)
          const variantId = cartItem.variant
          
          console.log('🔍 Resolving cart item variant:', {
            variantId,
            colorId: cartItem.color,
            storageId: cartItem.storage,
            cartItem
          })

          const { data: variant, error: variantError } = await supabase
            .from('variants')
            .select('id, brand, model, deviceType, colors, storages')
            .eq('id', variantId)
            .single()

          if (variantError) {
            console.error('❌ Error fetching variant for cart item:', variantError)
            console.error('❌ Variant ID:', variantId)
          }

          if (variant) {
            console.log('✅ Found variant:', variant.model)
            console.log('🔍 Variant colors:', variant.colors?.length, 'items')
            console.log('🔍 Variant storages:', variant.storages?.length, 'items')

            // Resolve color from variant
            let resolvedColor = null
            if (cartItem?.color && variant.colors) {
              const colorId = String(cartItem.color)
              console.log('🔍 Looking for color ID:', colorId)
              
              const colorObj = Array.isArray(variant.colors)
                ? variant.colors.find((c) => {
                    const cId = String(c._id || c.id)
                    const match = cId === colorId
                    if (!match) {
                      console.log('  - Color ID mismatch:', cId, 'vs', colorId)
                    }
                    return match
                  })
                : null
              
              console.log('🔍 Found color object:', colorObj ? 'Yes' : 'No')
              
              if (colorObj) {
                resolvedColor = {
                  id: colorObj._id || colorObj.id,
                  label: colorObj.label,
                  images: colorObj.images || [],
                  primaryIndex: colorObj.primaryIndex || 0,
                }
                console.log('✅ Resolved color:', resolvedColor.label)
              } else {
                console.log('⚠️ Color not found in variant. Available colors:', variant.colors.map(c => ({ id: c._id || c.id, label: c.label })))
              }
            }

            // Resolve storage from variant
            let resolvedStorage = null
            if (cartItem?.storage && variant.storages) {
              const storageId = String(cartItem.storage)
              console.log('🔍 Looking for storage ID:', storageId)
              
              const storageObj = Array.isArray(variant.storages)
                ? variant.storages.find((s) => {
                    const sId = String(s._id || s.id)
                    const match = sId === storageId
                    if (!match) {
                      console.log('  - Storage ID mismatch:', sId, 'vs', storageId)
                    }
                    return match
                  })
                : null
              
              console.log('🔍 Found storage object:', storageObj ? 'Yes' : 'No')
              
              if (storageObj) {
                resolvedStorage = {
                  id: storageObj._id || storageObj.id,
                  label: storageObj.label,
                  price: storageObj.price || null,
                }
                console.log('✅ Resolved storage:', resolvedStorage.label, 'Price:', resolvedStorage.price)
              } else {
                console.log('⚠️ Storage not found in variant. Available storages:', variant.storages.map(s => ({ id: s._id || s.id, label: s.label, price: s.price })))
              }
            }

            cartItems.push({
              id: cartItem?.id || cartItem?._id,
              variant: {
                id: variant.id,
                brand: variant.brand,
                model: variant.model,
                deviceType: variant.deviceType,
                colors: variant.colors || [],
                storages: variant.storages || [],
              },
              // Always return objects, never IDs
              storage: resolvedStorage || null,
              color: resolvedColor || null,
              onOffer: false,
            })
            
            console.log('✅ Cart item resolved:', {
              model: variant.model,
              storageLabel: resolvedStorage?.label || 'NOT RESOLVED',
              colorLabel: resolvedColor?.label || 'NOT RESOLVED',
              price: resolvedStorage?.price || 'NOT RESOLVED'
            })
          } else {
            console.error('❌ Variant not found for cart item:', variantId)
            // Return cart item with minimal data even if variant not found
            cartItems.push({
              id: cartItem?.id || cartItem?._id,
              variant: null,
              storage: null, // Must be object or null, not ID
              color: null, // Must be object or null, not ID
              onOffer: false,
            })
          }
        } else if (cartItem?.device) {
          // Device-based cart item (specific device on offer)
          const { data: device } = await supabase
            .from('devices')
            .select('*')
            .eq('id', cartItem.device)
            .single()

          if (device && device.status === 'Available') {
            // Fetch variant
            let variant = null
            if (device.variant_id) {
              const { data: variantData } = await supabase
                .from('variants')
                .select('id, brand, model, deviceType, colors, storages')
                .eq('id', device.variant_id)
                .single()
              
              variant = variantData ? {
                id: variantData.id,
                brand: variantData.brand,
                model: variantData.model,
                deviceType: variantData.deviceType,
                colors: variantData.colors || [],
                storages: variantData.storages || [],
              } : null
            }

            // Check if offer is active
            let isOfferActive = false
            if (device.offer_id) {
              const { data: offerData } = await supabase
                .from('offers')
                .select('start, end')
                .eq('id', device.offer_id)
                .single()
              
              if (offerData) {
                const now = new Date().getTime()
                const startTime = parseInt(offerData.start) || 0
                const endTime = parseInt(offerData.end) || 0
                isOfferActive = now > startTime && now < endTime
              }
            }

            if (isOfferActive) {
              // Resolve color and storage
              let resolvedColor = null
              let resolvedStorage = null
              
              if (variant && device.color) {
                const colorObj = Array.isArray(variant.colors)
                  ? variant.colors.find((c) => String(c._id || c.id) === String(device.color))
            : null
                if (colorObj) {
                  resolvedColor = {
                    id: colorObj._id || colorObj.id,
                    label: colorObj.label,
                    images: colorObj.images || [],
                    primaryIndex: colorObj.primaryIndex || 0,
                  }
                }
              }

              if (variant && device.storage) {
                const storageObj = Array.isArray(variant.storages)
                  ? variant.storages.find((s) => String(s._id || s.id) === String(device.storage))
                  : null
                if (storageObj) {
                  resolvedStorage = {
                    id: storageObj._id || storageObj.id,
                    label: storageObj.label,
                    price: storageObj.price || null,
                  }
                }
              }

              // Resolve offer
              let offer = null
              if (device.offer_id) {
                const { data: offerData } = await supabase
                  .from('offers')
                  .select('*')
                  .eq('id', device.offer_id)
                  .single()
                
                if (offerData) {
                  offer = {
                    info: {
                      id: offerData.id,
                      label: offerData.label || offerData.title,
                      start: offerData.start,
                      end: offerData.end,
                    },
                    price: device.offer_price || null,
                  }
                }
              }

              cartItems.push({
                id: cartItem?.id || cartItem?._id,
                variant: variant,
                storage: resolvedStorage,
                color: resolvedColor,
                device: {
                  id: device.id,
                  variant: variant,
                  color: resolvedColor,
                  storage: resolvedStorage,
                  offer: offer,
                },
              onOffer: true,
            })
            }
          }
        }
      }

      return cartItems
    },
    orders: async (parent, args) => {
      const userId = parent.id
      if (!userId) {
        console.log('⚠️ User.orders: No user ID provided')
        return []
      }

      console.log('🔍 User.orders: Fetching orders for user:', userId)

      try {
        // Strategy: Try multiple query methods to find orders
        // 1. Try user_id column (if it exists and is populated)
        // 2. Try saleInfo->>customer (backward compatibility)
        // 3. Fetch all and filter in JavaScript (ultimate fallback)
        
        let orders = null
        let error = null
        
        // Method 1: Try user_id column (but don't fail if column doesn't exist)
        try {
          const { data: ordersByUserId, error: userIdError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
          
          // Only use this if no error AND we got results
          if (!userIdError && ordersByUserId && ordersByUserId.length > 0) {
            orders = ordersByUserId
            console.log(`✅ User.orders: Found ${orders.length} orders via user_id column`)
          } else if (userIdError) {
            // If error is about column not existing, that's okay, try next method
            if (!userIdError.message?.includes('column') && !userIdError.message?.includes('does not exist')) {
              console.warn('⚠️ User.orders: Error querying user_id column:', userIdError.message)
            }
          }
        } catch (userIdErr) {
          // Column might not exist, that's okay
          console.log('⚠️ User.orders: user_id column query failed (may not exist):', userIdErr.message)
        }

        // Method 2: Try saleInfo->>customer (works even if user_id column doesn't exist)
        if (!orders || orders.length === 0) {
          console.log('⚠️ User.orders: Trying saleInfo->>customer query method...')
          try {
            const { data: ordersBySaleInfo, error: saleInfoError } = await supabase
              .from('orders')
              .select('*')
              .filter('saleInfo->>customer', 'eq', userId)
              .order('created_at', { ascending: false })
            
            if (!saleInfoError && ordersBySaleInfo) {
              orders = ordersBySaleInfo
              error = null
              console.log(`✅ User.orders: Found ${orders.length} orders via saleInfo->>customer`)
            } else if (saleInfoError) {
              console.warn('⚠️ User.orders: saleInfo query error:', saleInfoError.message)
            }
          } catch (saleInfoErr) {
            console.warn('⚠️ User.orders: saleInfo query exception:', saleInfoErr.message)
          }
        }

        // Method 3: Ultimate fallback - fetch all and filter in JavaScript
        if (!orders || orders.length === 0) {
          console.log('⚠️ User.orders: Trying JavaScript filter fallback...')
          try {
            const { data: allOrders, error: allError } = await supabase
              .from('orders')
              .select('*')
              .order('created_at', { ascending: false })
            
            if (!allError && allOrders) {
              // Filter in JavaScript - check both user_id and saleInfo.customer
              orders = allOrders.filter(order => {
                // Check user_id column first (if it exists and is populated)
                if (order.user_id && String(order.user_id) === String(userId)) {
                  return true
                }
                // Fallback to saleInfo.customer (this should always work)
                const saleInfo = order.saleInfo || {}
                const customerId = saleInfo.customer
                if (customerId && String(customerId) === String(userId)) {
                  return true
                }
                return false
              })
              error = null
              console.log(`✅ User.orders: Filtered ${orders.length} orders from ${allOrders.length} total`)
            } else if (allError) {
              error = allError
              console.error('❌ User.orders: Error fetching all orders:', allError)
            }
          } catch (allErr) {
            console.error('❌ User.orders: Exception fetching all orders:', allErr)
            error = allErr
          }
        }

        if (error) {
          console.error('❌ User.orders: Error fetching orders:', error)
          return []
        }

        if (!orders || orders.length === 0) {
          console.log('✅ User.orders: No orders found for user:', userId)
          return []
        }

        console.log(`✅ User.orders: Found ${orders.length} orders for user ${userId}`)

        // Resolve orders with variant and device data
        const resolvedOrders = await Promise.all(
          orders.map(async (order) => {
            try {
              // Resolve variant
              let variant = null
              if (order.variant_id) {
                const { data: variantData } = await supabase
                  .from('variants')
                  .select('id, brand, model, deviceType, colors, storages')
                  .eq('id', order.variant_id)
                  .single()
                
                if (variantData) {
                  variant = {
                    id: variantData.id,
                    brand: variantData.brand,
                    model: variantData.model,
                    deviceType: variantData.deviceType,
                    colors: variantData.colors || [],
                    storages: variantData.storages || [],
                  }
                }
              }

              // Resolve device if exists
              let device = null
              if (order.device_id) {
                const { data: deviceData } = await supabase
                  .from('devices')
                  .select('id, variant_id, storage, color, offer_price, status, offer_id')
                  .eq('id', order.device_id)
                  .single()
                
                if (deviceData) {
                  // Resolve offer if exists
                  let offer = null
                  if (deviceData.offer_id) {
                    const { data: offerData } = await supabase
                      .from('offers')
                      .select('*')
                      .eq('id', deviceData.offer_id)
                      .single()
                    
                    if (offerData) {
                      offer = {
                        info: {
                          id: offerData.id,
                          label: offerData.label || offerData.title,
                          start: offerData.start,
                          end: offerData.end,
                        },
                        price: deviceData.offer_price || null,
                      }
                    }
                  }

                  device = {
                    id: deviceData.id,
                    variant: variant,
                    storage: deviceData.storage,
                    color: deviceData.color,
                    offer: offer,
                  }
                }
              }

              // Resolve storage and color labels from variant
              let resolvedStorage = null
              let resolvedColor = null

              if (variant && order.storage) {
                const storageObj = Array.isArray(variant.storages)
                  ? variant.storages.find((s) => String(s._id || s.id) === String(order.storage))
                  : null
                
                if (storageObj) {
                  resolvedStorage = {
                    id: storageObj._id || storageObj.id,
                    label: storageObj.label,
                    price: storageObj.price || null,
                  }
                }
              }

              if (variant && order.color) {
                const colorObj = Array.isArray(variant.colors)
                  ? variant.colors.find((c) => String(c._id || c.id) === String(order.color))
                  : null
                
                if (colorObj) {
                  resolvedColor = {
                    id: colorObj._id || colorObj.id,
                    label: colorObj.label,
                    images: colorObj.images || [],
                    primaryIndex: colorObj.primaryIndex || 0,
                  }
                }
              }

              return {
                id: order.id,
                variant: variant,
                device: device,
                storage: resolvedStorage?.id || order.storage,
                color: resolvedColor?.id || order.color,
                saleInfo: order.saleInfo || {},
                review: order.review || null,
              }
            } catch (orderError) {
              console.error(`❌ User.orders: Error resolving order ${order.id}:`, orderError)
              // Return minimal order data if resolution fails
              return {
                id: order.id,
                variant: null,
                device: null,
                storage: order.storage,
                color: order.color,
                saleInfo: order.saleInfo || {},
                review: order.review || null,
              }
            }
          })
        )

        console.log(`✅ User.orders: Successfully resolved ${resolvedOrders.length} orders`)
        return resolvedOrders
      } catch (err) {
        console.error('❌ User.orders: Fatal error:', err)
        return []
      }
    },
    financingRequests: async (parent, args) => {
      // Return empty array for now since FinanceRequest model is not available
      return []
    },
  },

  Device: {
    variant: async (parent, args) => {
      // If variant already resolved, return it
      if (parent?.variant && typeof parent.variant === 'object') {
        return parent.variant
      }

      // Otherwise fetch from Supabase
      const variantId = parent?.variant_id || parent?.variant
      if (!variantId) return null

      const { data: variant } = await supabase
        .from('variants')
        .select('id, brand, model, deviceType')
        .eq('id', variantId)
        .single()

      return variant
    },

    color: async (parent, args) => {
      // If color already resolved, return it
      if (parent?.color && typeof parent.color === 'object' && parent.color.label) {
        return parent.color
      }

      // Otherwise resolve from variant
      const variantId = parent?.variant_id || parent?.variant
      if (!variantId || !parent?.color) return null

      const { data: variant } = await supabase
        .from('variants')
        .select('colors')
        .eq('id', variantId)
        .single()

      if (!variant?.colors) return null

      const colorObj = Array.isArray(variant.colors)
        ? variant.colors.find((c) => String(c._id || c.id) === String(parent.color))
        : null

      return colorObj ? {
        id: colorObj._id || colorObj.id,
        label: colorObj.label,
      } : null
    },

    storage: async (parent, args) => {
      // If storage already resolved, return it
      if (parent?.storage && typeof parent.storage === 'object' && parent.storage.label) {
        return parent.storage
      }

      // Otherwise resolve from variant
      const variantId = parent?.variant_id || parent?.variant
      if (!variantId || !parent?.storage) return null

      const { data: variant } = await supabase
        .from('variants')
        .select('storages')
        .eq('id', variantId)
        .single()

      if (!variant?.storages) return null

      const storageObj = Array.isArray(variant.storages)
        ? variant.storages.find((s) => String(s._id || s.id) === String(parent.storage))
        : null

      return storageObj ? {
        id: storageObj._id || storageObj.id,
        label: storageObj.label,
      } : null
    },

    metadata: async (parent, args) => {
      const { data: repair } = await supabase
        .from('repairs')
        .select('*')
        .eq('device_id', parent?.id)
        .single()

      const repairCost = () => {
        if (!repair) return 0
        const partsCost = Array.isArray(repair?.partsBought)
          ? repair.partsBought.reduce((a, o) => a + (o?.cost || 0), 0)
          : 0
        return partsCost + (repair?.serviceCost || 0)
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
        repairDate: repair?.dateFixed ? String(repair.dateFixed) : null,
        repairCost: repairCost(),
      }

      return metadata
    },

    offer: async (parent, args) => {
      // If offer already resolved, return it
      if (parent?.offer && typeof parent.offer === 'object' && parent.offer.info) {
        return parent.offer
      }

      // Fetch offer info if offer_id exists
      let offerInfo = null
      const offerId = parent?.offer_id
      if (offerId) {
        const { data: offer } = await supabase
          .from('offers')
          .select('*')
          .eq('id', offerId)
          .single()
        
        offerInfo = offer
      }

      // Get offer price from device (offer_price column)
      const offerPrice = parent?.offer_price || null

      if (!offerInfo && !offerPrice) {
        return null
      }

      return {
        info: offerInfo,
        price: offerPrice,
      }
    },
  },

  Order: {
    device: async (parent, args) => {
      // If device already resolved from getAllOrders, return it
      if (parent?.device && typeof parent.device === 'object' && parent.device.id) {
        // If offer_id exists, fetch offer
        if (parent.device.offer_id && !parent.device.offer) {
          const { data: offerInfo } = await supabase
            .from('offers')
            .select('*')
            .eq('id', parent.device.offer_id)
            .single()
          
          if (offerInfo) {
            parent.device.offer = {
              info: offerInfo,
              price: null, // Price is on device, not offer
            }
          }
        }
        return parent.device
      }

      // Otherwise fetch from Supabase
      const deviceId = parent?.device_id || parent?.device
      if (!deviceId) return null

      const { data: device } = await supabase
        .from('devices')
        .select(`
          *,
          offers:offer_id(*)
        `)
        .eq('id', deviceId)
        .single()

      if (device && device.offers) {
        device.offer = {
          info: device.offers,
          price: null,
        }
        delete device.offers
      }

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
      // Fetch all blogs from Supabase
      const { data: blogs, error } = await supabase
        .from('blogs')
        .select('id, title, thumbnail, category, content, created_by, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching blogs:', error)
        return []
      }

      if (!blogs) return []

      // Resolve createdBy for each blog
      const blogsWithResolvedData = await Promise.all(
        blogs.map(async (blog) => {
          // Resolve createdBy user
          let createdBy = null
          if (blog.created_by || blog.createdBy) {
            const userId = blog.created_by || blog.createdBy
            const { data: userData } = await supabase
              .from('users')
              .select('id, name, email, image')
              .eq('id', userId)
              .single()
            
            createdBy = userData
          }

          return {
            id: blog.id,
            title: blog.title,
            thumbnail: blog.thumbnail,
            category: blog.category,
            content: blog.content,
            createdBy: createdBy,
            createdAt: blog.created_at || blog.createdAt,
          }
        })
      )

      return blogsWithResolvedData
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
      // Fetch all carousels from Supabase
      const { data: carousels, error } = await supabase
        .from('carousels')
        .select('id, small_screen, large_screen, link, created_by, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching carousels:', error)
        return []
      }

      if (!carousels) return []

      // Resolve createdBy for each carousel
      const carouselsWithResolvedData = await Promise.all(
        carousels.map(async (carousel) => {
          // Resolve createdBy user
          let createdBy = null
          if (carousel.created_by) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, name, email, image')
              .eq('id', carousel.created_by)
              .single()
            
            createdBy = userData
          }

          return {
            id: carousel.id,
            smallScreen: carousel.small_screen,
            largeScreen: carousel.large_screen,
            link: carousel.link,
            createdBy: createdBy,
            createdAt: carousel.created_at ? new Date(carousel.created_at).getTime().toString() : null,
          }
        })
      )

      return carouselsWithResolvedData
    },

    getAllOrders: async (_, args) => {
      console.log('🔍 getAllOrders: Starting to fetch orders...')
      
      try {
        // First fetch all orders
        const { data: orders, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ Error fetching orders:', error)
          return []
        }

        if (!orders || orders.length === 0) {
          console.log('✅ getAllOrders: No orders found')
          return []
        }

        console.log(`✅ getAllOrders: Found ${orders.length} total orders`)

        // Filter orders where saleVia = 'website' and resolve all related data
        const websiteOrders = orders.filter((order) => {
          // Filter by saleVia in JSONB
          const saleInfo = order.saleInfo || {}
          return saleInfo.saleVia === 'website'
        })

        console.log(`✅ getAllOrders: Found ${websiteOrders.length} website orders`)

        const ordersWithResolvedData = await Promise.all(
          websiteOrders.map(async (order, index) => {
            try {
              console.log(`🔍 getAllOrders: Processing order ${index + 1}/${websiteOrders.length} (ID: ${order.id})`)
            const saleInfo = order.saleInfo || {}
            
            // Resolve variant from variant_id or variant field
            let variant = null
            const variantId = order.variant_id || order.variant
            if (variantId) {
              try {
                const { data: variantData, error: variantError } = await supabase
                  .from('variants')
                  .select('id, brand, model, deviceType, colors, storages')
                  .eq('id', variantId)
                  .single()
                
                if (!variantError && variantData) {
                  variant = variantData
                } else if (variantError) {
                  console.error(`❌ Error fetching variant ${variantId} for order ${order.id}:`, variantError)
                }
              } catch (variantErr) {
                console.error(`❌ Exception fetching variant for order ${order.id}:`, variantErr)
              }
            }

            // Resolve device from device_id or device field
            let deviceWithOffer = null
            const deviceId = order.device_id || order.device
            if (deviceId) {
              try {
                const { data: deviceData, error: deviceError } = await supabase
                  .from('devices')
                  .select('id, imei, status, offer_id, serialNo, buyBackPrice, grade')
                  .eq('id', deviceId)
                  .single()
                
                if (!deviceError && deviceData) {
                  deviceWithOffer = deviceData
                  
                  // Resolve offer if offer_id exists
                  if (deviceData.offer_id) {
                    try {
                      const { data: offerInfo, error: offerError } = await supabase
                        .from('offers')
                        .select('*')
                        .eq('id', deviceData.offer_id)
                        .single()
                      
                      if (!offerError && offerInfo) {
                        deviceWithOffer.offer = {
                          info: offerInfo,
                          price: null,
                        }
                      }
                    } catch (offerErr) {
                      console.error(`❌ Error fetching offer for device ${deviceId}:`, offerErr)
                    }
                  }
                } else if (deviceError) {
                  console.error(`❌ Error fetching device ${deviceId} for order ${order.id}:`, deviceError)
                }
              } catch (deviceErr) {
                console.error(`❌ Exception fetching device for order ${order.id}:`, deviceErr)
              }
            }
            
            // Resolve customer from saleInfo.customer (could be ID or email)
            let customer = null
            if (saleInfo.customer) {
              try {
                if (typeof saleInfo.customer === 'string') {
                  // It's a user ID or email
                  const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id, name, email, phoneNumber, shipping')
                    .or(`id.eq.${saleInfo.customer},email.eq.${saleInfo.customer}`)
                    .single()
                  
                  if (!userError && userData) {
                    customer = userData
                  }
                } else if (saleInfo.customer.id || saleInfo.customer.email) {
                  // It's already an object
                  const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id, name, email, phoneNumber, shipping')
                    .or(`id.eq.${saleInfo.customer.id || saleInfo.customer.email},email.eq.${saleInfo.customer.email || saleInfo.customer.id}`)
                    .single()
                  
                  customer = (!userError && userData) ? userData : saleInfo.customer
                } else {
                  // Use customerName/customerPhoneNumber as fallback
                  customer = {
                    name: saleInfo.customerName || saleInfo.customer?.name,
                    phoneNumber: saleInfo.customerPhoneNumber || saleInfo.customer?.phoneNumber,
                    email: saleInfo.customer?.email,
                  }
                }
              } catch (customerError) {
                console.error(`❌ Error resolving customer for order ${order.id}:`, customerError)
                // Use fallback customer data
                customer = {
                  name: saleInfo.customerName,
                  phoneNumber: saleInfo.customerPhoneNumber,
                  email: null,
                }
              }
            }

            // Resolve recordedBy from saleInfo.recordedBy
            let recordedBy = null
            if (saleInfo.recordedBy) {
              try {
                if (typeof saleInfo.recordedBy === 'string') {
                  const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id, name, email')
                    .eq('id', saleInfo.recordedBy)
                    .single()
                  
                  if (!userError && userData) {
                    recordedBy = userData
                  }
                } else {
                  recordedBy = saleInfo.recordedBy
                }
              } catch (recordedByError) {
                console.error(`❌ Error resolving recordedBy for order ${order.id}:`, recordedByError)
                recordedBy = null
              }
            }

            // Build resolved saleInfo
            const resolvedSaleInfo = {
              ...saleInfo,
              customer: customer || {
                name: saleInfo.customerName,
                phoneNumber: saleInfo.customerPhoneNumber,
              },
              recordedBy: recordedBy,
            }

              return {
                ...order,
                variant: variant,
                device: deviceWithOffer,
                saleInfo: resolvedSaleInfo,
              }
            } catch (orderError) {
              console.error(`❌ Error processing order ${order.id}:`, orderError)
              // Return order with minimal data if resolution fails
              return {
                ...order,
                variant: null,
                device: null,
                saleInfo: order.saleInfo || {},
              }
            }
          })
        )

        console.log(`✅ getAllOrders: Successfully resolved ${ordersWithResolvedData.length} orders`)
        return ordersWithResolvedData
      } catch (err) {
        console.error('❌ getAllOrders: Fatal error:', err)
        console.error('❌ getAllOrders: Error stack:', err.stack)
        return []
      }
    },

    getAllFinancingRequests: async (_, args) => {
      // Fetch all financing requests from Supabase
      const { data: requests, error } = await supabase
        .from('financing_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching financing requests:', error)
        // If table doesn't exist, try alternative table name
        const { data: altRequests, error: altError } = await supabase
          .from('finance_requests')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (altError) {
          console.error('❌ Error fetching from finance_requests:', altError)
          return []
        }
        
        if (!altRequests) return []
        
        // Resolve data for alternative table
        return await Promise.all(
          altRequests.map(async (request) => {
            // Resolve variant
            let variant = null
            const variantId = request.variant_id || request.variant
            if (variantId) {
              const { data: variantData } = await supabase
                .from('variants')
                .select('id, brand, model, deviceType, colors, storages')
                .eq('id', variantId)
                .single()
              
              variant = variantData
            }

            // Resolve customer
            let customer = null
            const customerId = request.customer_id || request.customer
            if (customerId) {
              const { data: customerData } = await supabase
                .from('users')
                .select('id, name, email, phoneNumber, shipping')
                .eq('id', customerId)
                .single()
              
              customer = customerData
            }

            return {
              id: request.id,
          device: {
                variant: variant,
                storage: request.storage,
                color: request.color,
          },
              financer: request.financer,
              status: request.status,
              date: request.date || request.created_at,
              customer: customer,
            }
          })
        )
      }

      if (!requests) return []

      // Resolve variant and customer for each request
      const requestsWithResolvedData = await Promise.all(
        requests.map(async (request) => {
          // Resolve variant
          let variant = null
          const variantId = request.variant_id || request.variant
          if (variantId) {
            const { data: variantData } = await supabase
              .from('variants')
              .select('id, brand, model, deviceType, colors, storages')
              .eq('id', variantId)
              .single()
            
            variant = variantData
          }

          // Resolve customer
          let customer = null
          const customerId = request.customer_id || request.customer
          if (customerId) {
            const { data: customerData } = await supabase
              .from('users')
              .select('id, name, email, phoneNumber, shipping')
              .eq('id', customerId)
              .single()
            
            customer = customerData
      }

          return {
            id: request.id,
            device: {
              variant: variant,
              storage: request.storage,
              color: request.color,
            },
            financer: request.financer,
            status: request.status,
            date: request.date || request.created_at,
            customer: customer,
          }
        })
      )

      return requestsWithResolvedData
    },

    getDevice: async (_, { id }) => {
      // Fetch device without automatic joins to avoid FK conflicts
      const { data: device, error } = await supabase
        .from('devices')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !device) {
        console.error('❌ Error fetching device:', error)
        return null
      }

      // Resolve variant, color, storage, and offer (same as getDevices)
      let variant = null
      let resolvedColor = null
      let resolvedStorage = null
      let offer = null

      if (device.variant_id) {
        // Fetch variant to get colors/storages
        const { data: variantData } = await supabase
          .from('variants')
          .select('id, brand, model, deviceType, colors, storages, technicalSpecifications')
          .eq('id', device.variant_id)
          .single()
        
        variant = variantData ? {
          id: variantData.id,
          brand: variantData.brand,
          model: variantData.model,
          deviceType: variantData.deviceType,
          technicalSpecifications: variantData.technicalSpecifications || [],
        } : null

        // Resolve color from variant
        if (device.color && variantData?.colors) {
          const colorObj = Array.isArray(variantData.colors)
            ? variantData.colors.find((c) => String(c._id || c.id) === String(device.color))
            : null
          if (colorObj) {
            resolvedColor = {
              id: colorObj._id || colorObj.id,
              label: colorObj.label,
              colorCode: colorObj.colorCode || null,
              images: colorObj.images || [],
              primaryIndex: colorObj.primaryIndex || 0,
            }
          }
        }

        // Resolve storage from variant
        if (device.storage && variantData?.storages) {
          const storageObj = Array.isArray(variantData.storages)
            ? variantData.storages.find((s) => String(s._id || s.id) === String(device.storage))
            : null
          if (storageObj) {
            resolvedStorage = {
              id: storageObj._id || storageObj.id,
              label: storageObj.label,
              price: storageObj.price || null,
            }
          }
        }
      }

      // Resolve offer
      if (device.offer_id) {
        const { data: offerData } = await supabase
          .from('offers')
          .select('*')
          .eq('id', device.offer_id)
          .single()
        
        if (offerData) {
          offer = {
            info: {
              id: offerData.id,
              label: offerData.label || offerData.title,
              start: offerData.start,
              end: offerData.end,
            },
            price: device.offer_price || null,
          }
        }
      }

      return {
        ...device,
        variant: variant,
        color: resolvedColor,
        storage: resolvedStorage,
        offer: offer,
        createdAt: device.created_at || device.createdAt,
      }
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
      // Fetch devices without automatic joins to avoid FK conflicts
      const { data: devices, error } = await supabase
        .from('devices')
        .select('*')
        .eq('status', 'Available')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching devices:', error)
        return []
      }

      if (!devices) return []

      // Resolve color, storage, variant, and offer for each device
      const devicesWithResolvedData = await Promise.all(
        devices.map(async (device) => {
          // Resolve variant
          let variant = null
          if (device.variant_id) {
            const { data: variantData } = await supabase
              .from('variants')
              .select('id, brand, model, deviceType, colors, storages')
              .eq('id', device.variant_id)
              .single()
            
            variant = variantData ? {
              id: variantData.id,
              brand: variantData.brand,
              model: variantData.model,
              deviceType: variantData.deviceType,
            } : null

            // Resolve color from variant
            let resolvedColor = null
            if (device.color && variantData?.colors) {
              const colorObj = Array.isArray(variantData.colors)
                ? variantData.colors.find((c) => String(c._id || c.id) === String(device.color))
                : null
              if (colorObj) {
                resolvedColor = {
                  id: colorObj._id || colorObj.id,
                  label: colorObj.label,
                  images: colorObj.images || [],
                  primaryIndex: colorObj.primaryIndex || 0,
                }
              }
            }

            // Resolve storage from variant
            let resolvedStorage = null
            if (device.storage && variantData?.storages) {
              const storageObj = Array.isArray(variantData.storages)
                ? variantData.storages.find((s) => String(s._id || s.id) === String(device.storage))
                : null
              if (storageObj) {
                resolvedStorage = {
                  id: storageObj._id || storageObj.id,
                  label: storageObj.label,
                }
              }
            }

            // Resolve offer
            let offer = null
            if (device.offer_id) {
              const { data: offerData } = await supabase
                .from('offers')
                .select('*')
                .eq('id', device.offer_id)
                .single()
              
              if (offerData) {
                offer = {
                  info: {
                    id: offerData.id,
                    label: offerData.label || offerData.title,
                    start: offerData.start,
                    end: offerData.end,
                  },
                  price: device.offer_price || null,
                }
              }
            }

            return {
              ...device,
              variant: variant,
              color: resolvedColor,
              storage: resolvedStorage,
              offer: offer,
              createdAt: device.created_at || device.createdAt,
            }
          } else {
            // No variant, return device as-is but ensure createdAt is set
            return {
              ...device,
              createdAt: device.created_at || device.createdAt,
            }
          }
        })
      )

      return devicesWithResolvedData
    },

    getBuyBacks: async (_, args) => {
      // Fetch all buybacks from Supabase
      const { data: buybacks, error } = await supabase
        .from('buybacks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching buybacks:', error)
        return []
      }

      if (!buybacks) return []

      // Resolve variant and user for each buyback
      const buybacksWithResolvedData = await Promise.all(
        buybacks.map(async (buyback) => {
          // Resolve variant
          let variant = null
          const variantId = buyback.variant_id || buyback.variant
          if (variantId) {
            const { data: variantData } = await supabase
              .from('variants')
              .select('id, brand, model, deviceType, authCost, backCamCost, batteryCost, bodyCost, motherBoardCost, mouthpieceCost, screenCost, simTrayCost, frontCamCost, speakerCost, earpieceCost, colors, storages, removed')
              .eq('id', variantId)
              .single()
            
            variant = variantData
          }

          // Resolve user
          let user = null
          const userId = buyback.user_id || buyback.user
          if (userId) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, name, email, phoneNumber')
              .eq('id', userId)
              .single()
            
            user = userData
          }

          return {
            ...buyback,
            id: buyback.id,
            variant: variant,
            user: user,
            storage: buyback.storage,
            color: buyback.color,
            batteryHealth: buyback.batteryHealth,
            frontCamOk: buyback.frontCamOk,
            backCamOk: buyback.backCamOk,
            earpieceOk: buyback.earpieceOk,
            mouthpieceOk: buyback.mouthpieceOk,
            speakerOk: buyback.speakerOk,
            authorizationOk: buyback.authorizationOk,
            simTrayPresent: buyback.simTrayPresent,
            chargingOk: buyback.chargingOk,
            screenCondition: buyback.screenCondition,
            sideNBackCondition: buyback.sideNBackCondition,
            offer: buyback.offer,
            createdAt: buyback.created_at || buyback.createdAt,
            payment: buyback.payment || null,
            cancelled: buyback.cancelled || false,
          }
        })
      )

      return buybacksWithResolvedData
    },

    getOffers: async (_, args) => {
      // Fetch all offers from Supabase
      const { data: offers, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching offers:', error)
        return []
      }

      if (!offers) return []

      let _offers = []

      for (let i = 0; i < offers.length; i++) {
        const offer = offers[i]

        // Resolve createdBy user
        let createdBy = null
        if (offer.created_by || offer.createdBy) {
          const userId = offer.created_by || offer.createdBy
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, email, image')
            .eq('id', userId)
            .single()
          
          createdBy = userData
        }

        let info = {
          id: offer.id,
          label: offer.label,
          start: offer.start,
          end: offer.end,
          createdBy: createdBy,
          createdAt: offer.created_at || offer.createdAt,
        }

        // Fetch devices for this offer
        const { data: devices } = await supabase
          .from('devices')
          .select('*')
          .eq('offer_id', offer.id)

        // Resolve variant, color, storage for each device (same as getDevices)
        let resolvedDevices = []
        if (devices && devices.length > 0) {
          resolvedDevices = await Promise.all(
            devices.map(async (device) => {
              // Resolve variant
              let variant = null
              if (device.variant_id) {
                const { data: variantData } = await supabase
                  .from('variants')
                  .select('id, brand, model, deviceType, colors, storages')
                  .eq('id', device.variant_id)
                  .single()
                
                variant = variantData ? {
                  id: variantData.id,
                  brand: variantData.brand,
                  model: variantData.model,
                  deviceType: variantData.deviceType,
                  colors: variantData.colors || [],
                } : null

                // Resolve color from variant
                let resolvedColor = null
                if (device.color && variantData?.colors) {
                  const colorObj = Array.isArray(variantData.colors)
                    ? variantData.colors.find((c) => String(c._id || c.id) === String(device.color))
                    : null
                  if (colorObj) {
                    resolvedColor = {
                      id: colorObj._id || colorObj.id,
                      label: colorObj.label,
                      images: colorObj.images || [],
                      primaryIndex: colorObj.primaryIndex || 0,
                    }
                  }
                }

                // Resolve storage from variant
                let resolvedStorage = null
                if (device.storage && variantData?.storages) {
                  const storageObj = Array.isArray(variantData.storages)
                    ? variantData.storages.find((s) => String(s._id || s.id) === String(device.storage))
                    : null
                  if (storageObj) {
                    resolvedStorage = {
                      id: storageObj._id || storageObj.id,
                      label: storageObj.label,
                      price: storageObj.price || null,
                    }
                  }
                }

                return {
                  ...device,
                  variant: variant,
                  color: resolvedColor,
                  storage: resolvedStorage,
                  offer: {
                    info: {
                      id: offer.id,
                      label: offer.label || offer.title,
                      start: offer.start,
                      end: offer.end,
                    },
                    price: device.offer_price || null,
                  },
                  createdAt: device.created_at || device.createdAt,
                }
              } else {
                return {
                  ...device,
                  createdAt: device.created_at || device.createdAt,
                }
              }
            })
          )
        }

        _offers.push({
          info,
          devices: resolvedDevices,
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


    getRunningOffers: async (_, args) => {
      const now = new Date().getTime()

      // Fetch all offers from Supabase
      const { data: allOffers, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching running offers:', error)
        return []
      }

      if (!allOffers) return []

      // Filter offers that are currently running
      let offers = allOffers.filter((offer) => {
        const startTime = parseInt(offer?.start) || 0
        const endTime = parseInt(offer?.end) || 0
        return now > startTime && now < endTime
      })

      let runningOffers = []

      for (let i = 0; i < offers.length; i++) {
        const offer = offers[i]

        // Resolve createdBy user
        let createdBy = null
        if (offer.created_by || offer.createdBy) {
          const userId = offer.created_by || offer.createdBy
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, email, image')
            .eq('id', userId)
            .single()
          
          createdBy = userData
        }

        let info = {
          id: offer.id,
          label: offer.label,
          start: offer.start,
          end: offer.end,
          createdBy: createdBy,
          createdAt: offer.created_at || offer.createdAt,
        }

        // Fetch devices for this offer
        const { data: devices } = await supabase
          .from('devices')
          .select('*')
          .eq('offer_id', offer.id)

        // Resolve variant, color, storage for each device (same as getDevices)
        let resolvedDevices = []
        if (devices && devices.length > 0) {
          resolvedDevices = await Promise.all(
            devices.map(async (device) => {
              // Resolve variant
              let variant = null
              if (device.variant_id) {
                const { data: variantData } = await supabase
                  .from('variants')
                  .select('id, brand, model, deviceType, colors, storages')
                  .eq('id', device.variant_id)
                  .single()
                
                variant = variantData ? {
                  id: variantData.id,
                  brand: variantData.brand,
                  model: variantData.model,
                  deviceType: variantData.deviceType,
                  colors: variantData.colors || [],
                } : null

                // Resolve color from variant
                let resolvedColor = null
                if (device.color && variantData?.colors) {
                  const colorObj = Array.isArray(variantData.colors)
                    ? variantData.colors.find((c) => String(c._id || c.id) === String(device.color))
                    : null
                  if (colorObj) {
                    resolvedColor = {
                      id: colorObj._id || colorObj.id,
                      label: colorObj.label,
                      images: colorObj.images || [],
                      primaryIndex: colorObj.primaryIndex || 0,
                    }
                  }
                }

                // Resolve storage from variant
                let resolvedStorage = null
                if (device.storage && variantData?.storages) {
                  const storageObj = Array.isArray(variantData.storages)
                    ? variantData.storages.find((s) => String(s._id || s.id) === String(device.storage))
                    : null
                  if (storageObj) {
                    resolvedStorage = {
                      id: storageObj._id || storageObj.id,
                      label: storageObj.label,
                      price: storageObj.price || null,
                    }
                  }
                }

                return {
                  ...device,
                  variant: variant,
                  color: resolvedColor,
                  storage: resolvedStorage,
                  offer: {
                    info: {
                      id: offer.id,
                      label: offer.label || offer.title,
                      start: offer.start,
                      end: offer.end,
                    },
                    price: device.offer_price || null,
                  },
                  createdAt: device.created_at || device.createdAt,
                }
              } else {
                return {
                  ...device,
                  createdAt: device.created_at || device.createdAt,
                }
              }
            })
          )
        }

        runningOffers.push({
          info,
          devices: resolvedDevices,
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
      const { data: repairs, error } = await supabase
        .from('repairs')
        .select(`
          *,
          device:device_id(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching repairs:', error)
        return []
      }

      return repairs || []
    },

    getCustomers: async (_, args) => {
      const { data: customers } = await supabase
        .from('users')
        .select('*')
      return customers
    },

    getSales: async (_, args) => {
      // Fetch all orders that have a device (sales)
      // First try with device_id, if that fails, filter in JavaScript
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching orders for sales:', error)
        return []
      }

      if (!orders) return []

      // Filter orders that have a device (either device_id or device field)
      const ordersWithDevices = orders.filter((order) => {
        const deviceId = order.device_id || order.device
        return deviceId != null && deviceId !== ''
      })

      let sales = []

      for (let i = 0; i < ordersWithDevices.length; i++) {
        const order = ordersWithDevices[i]
        const saleInfo = order.saleInfo || {}

        // Fetch device
        let device = null
        const deviceId = order.device_id || order.device
        if (deviceId) {
          const { data: deviceData } = await supabase
            .from('devices')
            .select('id, imei, serialNo, variant_id, color, storage, buyBackPrice')
            .eq('id', deviceId)
            .single()
          
          device = deviceData
        }

        if (!device) continue

        // Fetch variant
        let variant = null
        const variantId = device.variant_id || device.variant || order.variant_id || order.variant
        if (variantId) {
          const { data: variantData } = await supabase
            .from('variants')
            .select('id, model, colors, storages')
            .eq('id', variantId)
            .single()
          
          variant = variantData
        }

        // Fetch repair to calculate repair cost
        const { data: repair } = await supabase
          .from('repairs')
          .select('*')
          .eq('device_id', device.id)
          .single()

        // Calculate repair cost
        let repairCostValue = 0
        if (repair) {
          const partsCost = Array.isArray(repair?.partsBought)
            ? repair.partsBought.reduce((a, o) => a + (o?.cost || 0), 0)
            : 0
          repairCostValue = partsCost + (repair?.serviceCost || 0)
        }

        // Resolve color label
        let colorLabel = null
        if (device.color && variant?.colors) {
          const colorObj = Array.isArray(variant.colors)
            ? variant.colors.find((c) => String(c._id || c.id) === String(device.color))
            : null
          colorLabel = colorObj?.label || null
        }

        // Resolve storage label
        let storageLabel = null
        if (device.storage && variant?.storages) {
          const storageObj = Array.isArray(variant.storages)
            ? variant.storages.find((s) => String(s._id || s.id) === String(device.storage))
            : null
          storageLabel = storageObj?.label || null
        }

        // Resolve customer name
        let customerName = saleInfo.customerName
        if (!customerName && saleInfo.customer) {
          if (typeof saleInfo.customer === 'string') {
            const { data: userData } = await supabase
              .from('users')
              .select('name')
              .or(`id.eq.${saleInfo.customer},email.eq.${saleInfo.customer}`)
              .single()
            customerName = userData?.name
          } else {
            customerName = saleInfo.customer.name
          }
        }

        // Resolve customer phone number
        let customerPhoneNumber = saleInfo.customerPhoneNumber
        if (!customerPhoneNumber && saleInfo.customer) {
          if (typeof saleInfo.customer === 'string') {
            const { data: userData } = await supabase
              .from('users')
              .select('phoneNumber')
              .or(`id.eq.${saleInfo.customer},email.eq.${saleInfo.customer}`)
              .single()
            customerPhoneNumber = userData?.phoneNumber
          } else {
            customerPhoneNumber = saleInfo.customer.phoneNumber
          }
        }

        // Resolve recordedBy
        let recordedBy = null
        if (saleInfo.recordedBy) {
          if (typeof saleInfo.recordedBy === 'string') {
            const { data: userData } = await supabase
              .from('users')
              .select('id, name, email')
              .eq('id', saleInfo.recordedBy)
              .single()
            recordedBy = userData
          } else {
            recordedBy = saleInfo.recordedBy
          }
        }
        const salePrice = saleInfo?.payment?.amount || 0
        const purchasePrice = device.buyBackPrice || 0

        let margin = salePrice - repairCostValue - purchasePrice

        sales.push({
          variant: variant?.model || null,
          color: colorLabel,
          storage: storageLabel,
          imei: device.imei,
          serialNo: device.serialNo,
          purchasePrice: purchasePrice,
          salePrice: salePrice,
          repairCost: repairCostValue,
          saleDate: saleInfo?.payment?.timestamp || null,
          customerName: customerName,
          customerPhoneNumber: customerPhoneNumber
            ? (customerPhoneNumber.startsWith('+') ? customerPhoneNumber : "+254" + customerPhoneNumber)
            : null,
          margin: margin,
          financer: saleInfo?.payment?.financing || null,
          saleVia: saleInfo?.saleVia || null,
          recordedBy: recordedBy,
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
            // Fetch repair details for the device from Supabase
            const { data: repair } = await supabase
              .from('repairs')
              .select('*')
              .eq('device_id', device.id)
              .single()

            // Calculate repair cost
            const repairCost = repair
              ? (Array.isArray(repair.partsBought)
                  ? repair.partsBought.reduce((sum, part) => sum + (part?.cost || 0), 0)
                  : 0) + (repair.serviceCost || 0)
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

      // Find device by IMEI in Supabase
      const { data: device } = await supabase
        .from('devices')
        .select('id')
        .eq('imei', imei)
        .single()

      const payload = {
        repairType,
        dateBrought,
        defects: Array.isArray(defects) ? defects : [],
        imei,
        variant,
        serialNo,
        device_id: device?.id || null,
        customer: {
          ...(customerName && { name: customerName }),
          ...(customerPhoneNumber && { phoneNumber: customerPhoneNumber }),
        },
      }

      const { data: repair, error } = await supabase
        .from('repairs')
        .insert(payload)
        .select('*')
        .single()

      if (error) {
        console.error('❌ Error creating repair:', error)
        throw new Error(`Failed to create repair: ${error.message}`)
      }

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

      console.log('🔍 createCarousel: Creating carousel with:', {
        smallScreen,
        largeScreen,
        link,
        createdBy
      })

      // Insert new carousel into Supabase
      const insertData = {
        small_screen: smallScreen,
        large_screen: largeScreen,
        link: link || null,
      }

      // Add created_by if provided
      if (createdBy) {
        insertData.created_by = createdBy
      }

      const { data: newCarousel, error } = await supabase
        .from('carousels')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating carousel:', error)
        throw new Error(`Failed to create carousel: ${error.message}`)
      }

      if (!newCarousel) {
        console.error('❌ No carousel returned from insert')
        throw new Error('Failed to create carousel: No data returned')
      }

      console.log('✅ Carousel created successfully:', newCarousel.id)

      // Resolve createdBy user
      let createdByUser = null
      if (newCarousel.created_by || createdBy) {
        const userId = newCarousel.created_by || createdBy
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email, image')
          .eq('id', userId)
          .single()
        
        createdByUser = userData
      }

      return {
        id: newCarousel.id,
        smallScreen: newCarousel.small_screen,
        largeScreen: newCarousel.large_screen,
        link: newCarousel.link,
        createdBy: createdByUser,
        createdAt: newCarousel.created_at ? new Date(newCarousel.created_at).getTime().toString() : null,
      }
    },

    removeCarousel: async (_, { id }) => {
      console.log('🔍 removeCarousel: Deleting carousel with id:', id)

      // First fetch the carousel to return it
      const { data: carousel, error: fetchError } = await supabase
        .from('carousels')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching carousel for deletion:', fetchError)
        throw new Error(`Failed to find carousel: ${fetchError.message}`)
      }

      if (!carousel) {
        console.error('❌ Carousel not found:', id)
        throw new Error('Carousel not found')
      }

      // Delete the carousel
      const { error: deleteError } = await supabase
        .from('carousels')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('❌ Error deleting carousel:', deleteError)
        throw new Error(`Failed to delete carousel: ${deleteError.message}`)
      }

      console.log('✅ Carousel deleted successfully:', id)

      // Resolve createdBy user for return value
      let createdByUser = null
      if (carousel.created_by) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email, image')
          .eq('id', carousel.created_by)
          .single()
        
        createdByUser = userData
      }

      return {
        id: carousel.id,
        smallScreen: carousel.small_screen,
        largeScreen: carousel.large_screen,
        link: carousel.link,
        createdBy: createdByUser,
        createdAt: carousel.created_at ? new Date(carousel.created_at).getTime().toString() : null,
      }
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

      console.log('🔍 editRights: Updating admin rights for user:', {
        id,
        rights,
        changedBy
      })

      // The existing supabase client already uses service role key
      const updateData = {
        adminRights: rights || [],
      }

      // Only add rulesSetBy if changedBy is provided
      if (changedBy) {
        updateData.rulesSetBy = changedBy
      }

      const { data: admin, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating admin rights:', error)
        console.error('❌ Error details:', JSON.stringify(error, null, 2))
        throw new Error(`Failed to update admin rights: ${error.message}`)
      }

      if (!admin) {
        console.error('❌ No admin returned from update')
        throw new Error('Failed to update admin rights: No data returned')
      }

      console.log('✅ Admin rights updated successfully:', admin.id)
      console.log('✅ Updated admin rights:', admin.adminRights)

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

      // Validate inputs
      if (!offerId || !deviceId || price === undefined || price === null) {
        throw new Error('Missing required fields: offerId, deviceId, and price are required')
      }

      try {
        const adminNumbers = ["+254111404330", "+254748920306"]

        for (let number of adminNumbers) {
          await sendText(number, `New offer!!!!`)
        }
      } catch (error) {
        console.error("SMS sending failed:", error)
      }

      // Build update payload - only include offer_price if it's a valid number
      const updatePayload = {
        offer_id: offerId,
      }
      
      // Only add offer_price if price is provided and is a valid number
      if (price !== null && price !== undefined && !isNaN(price)) {
        updatePayload.offer_price = parseInt(price)
      }

      console.log('🔍 Updating device with offer:', { deviceId, offerId, price, updatePayload })

      // Update device in Supabase to add it to the offer
      const { data: updatedDevice, error: updateError } = await supabase
        .from('devices')
        .update(updatePayload)
        .eq('id', deviceId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating device offer:', updateError)
        console.error('❌ Update payload was:', updatePayload)
        console.error('❌ Device ID:', deviceId)
        
        // Provide more helpful error messages
        if (updateError.code === '42703') {
          throw new Error(`Column does not exist. Please run the SQL script to add 'offer_price' and 'offer_id' columns to the devices table. Error: ${updateError.message}`)
        } else if (updateError.code === '42501') {
          throw new Error(`Permission denied. Please check RLS policies on the devices table. Error: ${updateError.message}`)
        } else {
          throw new Error(`Failed to add device to offer: ${updateError.message}`)
        }
      }

      if (!updatedDevice) {
        throw new Error('Failed to update device: No data returned')
      }

      console.log('✅ Device updated successfully:', updatedDevice.id)

      // Fetch device with variant and offer info
      const { data: deviceWithVariant, error: deviceError } = await supabase
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .single()

      if (deviceError || !deviceWithVariant) {
        console.error('❌ Error fetching device:', deviceError)
        throw new Error(`Failed to fetch device: ${deviceError?.message || 'Device not found'}`)
      }

      // Fetch variant with colors and storages
      let variant = null
      if (deviceWithVariant.variant_id) {
        const { data: variantData } = await supabase
          .from('variants')
          .select('id, model, colors, storages')
          .eq('id', deviceWithVariant.variant_id)
          .single()
        
        variant = variantData
      }

      // Fetch offer info
      let offerInfo = null
      if (offerId) {
        const { data: offer } = await supabase
          .from('offers')
          .select('*')
          .eq('id', offerId)
          .single()
        
        offerInfo = offer
      }

      // Construct device object in expected format for email template
      const device = {
        id: deviceWithVariant.id,
        variant: variant,
        color: deviceWithVariant.color,
        storage: deviceWithVariant.storage,
        offer: {
          info: offerInfo,
          price: price,
        },
      }

      // Fetch mailing list
      const { data: mailing } = await supabase
        .from('mailings')
        .select('email')
      
      const mailingList = mailing || []

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

      for (let to of mailingList) {
        transporter
          .sendMail({
            to: to?.email,
            subject: `${device?.variant?.model} on offer!`,
            html,
          })
          .then(() => console.log("Hey there"))
          .catch(console.log)
      }

      // Return device in expected format
      return {
        ...deviceWithVariant,
        variant: variant,
        offer: {
          info: offerInfo,
          price: price,
        },
      }
    },

    createOffer: async (_, { label, start, end, createdBy }) => {
      // Insert new offer into Supabase
      // Note: The table might have 'title' column instead of 'label'
      // Try both to handle different table schemas
      const insertData = {
        label: label,
        title: label, // Map label to title if table has title column
        start: start,
        end: end, // Supabase will handle quoting this reserved keyword
      }
      
      // Add created_by if provided
      if (createdBy) {
        insertData.created_by = createdBy
      }
      
      // Insert the offer
      const { data: newOffer, error } = await supabase
        .from('offers')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating offer:', error)
        throw new Error(`Failed to create offer: ${error.message}`)
      }

      if (!newOffer) {
        throw new Error('Failed to create offer: No data returned')
      }

      // Resolve createdBy user
      let createdByUser = null
      if (newOffer.created_by || createdBy) {
        const userId = newOffer.created_by || createdBy
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email, image')
          .eq('id', userId)
          .single()
        
        createdByUser = userData
      }

      return {
        info: {
          id: newOffer.id,
          label: newOffer.label || newOffer.title, // Handle both label and title
          start: newOffer.start,
          end: newOffer.end,
          createdBy: createdByUser,
          createdAt: newOffer.created_at || newOffer.createdAt,
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

      const normalizeArrayOfObjects = (arr = [], type = 'color') => {
        try {
          const parsed = Array.isArray(arr) ? arr : JSON.parse(arr || '[]')
          return parsed.map((item) => {
            const asObj = typeof item === 'object' && item !== null ? item : { _id: String(item), label: String(item) }
            const idCandidate = asObj._id ?? asObj.id ?? (asObj.id && asObj.id.$oid) ?? asObj.label
            const normalizedId = String(idCandidate)
            if (type === 'color') {
              return {
                _id: normalizedId,
                label: asObj.label ?? normalizedId,
                colorCode: asObj.colorCode ?? '#FFFFFF',
                images: Array.isArray(asObj.images) ? asObj.images : [],
              }
            }
            return {
              _id: normalizedId,
              label: asObj.label ?? normalizedId,
              price: typeof asObj.price === 'number' ? asObj.price : parseInt(asObj.price ?? 0, 10) || 0,
            }
          })
        } catch (e) {
          return []
        }
      }

      const payload = {
        tradeInAllowed,
        deviceType,
        brand,
        model,
        technicalSpecifications: JSON.parse(technicalSpecifications || "[]"),

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

        colors: normalizeArrayOfObjects(colors, 'color'),
        storages: normalizeArrayOfObjects(storages, 'storage'),
        financing,
        removed: false,
        featured: false,
      }

      const { data, error } = await supabase
        .from('variants')
        .insert(payload)
        .select('*')
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
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

      let _metaData = JSON.parse(metadata || '{}')

      // Fetch variant to get model and brand (required columns in devices table)
      let variantModel = null
      let variantBrand = null
      if (variant) {
        const { data: variantData, error: variantError } = await supabase
          .from('variants')
          .select('model, brand')
          .eq('id', variant)
          .single()
        
        if (variantError || !variantData) {
          throw new Error(`Variant not found: ${variantError?.message || 'Invalid variant ID'}`)
        }
        
        variantModel = variantData?.model
        variantBrand = variantData?.brand
      }

      if (!variantModel) {
        throw new Error('Model is required. Please select a valid variant.')
      }

      if (!variantBrand) {
        throw new Error('Brand is required. Please select a valid variant.')
      }

      // Validate IMEI uniqueness
      if (imei) {
        const { data: existingDeviceByImei, error: imeiCheckError } = await supabase
          .from('devices')
          .select('id, imei')
          .eq('imei', imei)
          .limit(1)
        
        if (!imeiCheckError && existingDeviceByImei && existingDeviceByImei.length > 0) {
          throw new Error(`A device with IMEI "${imei}" already exists in the inventory. IMEI must be unique.`)
        }
      }

      // Validate Serial Number uniqueness
      if (serial) {
        const { data: existingDeviceBySerial, error: serialCheckError } = await supabase
          .from('devices')
          .select('id, serialNo')
          .eq('serialNo', serial)
          .limit(1)
        
        if (!serialCheckError && existingDeviceBySerial && existingDeviceBySerial.length > 0) {
          throw new Error(`A device with Serial Number "${serial}" already exists in the inventory. Serial number must be unique.`)
        }
      }

      const payload = {
        imei: imei || null,
        variant_id: variant || null,
        model: variantModel, // Model from variant (required)
        brand: variantBrand, // Brand from variant (required)
        storage: storage || null,
        color: color || null,
        serialNo: serial || null,
        metadata: _metaData || {},
        buyBackPrice: buyBackPrice || null,
        grade: grade || null,
        status: 'Available',
      }

      console.log('🔍 Creating device with payload:', JSON.stringify(payload, null, 2))

      const { data: device, error } = await supabase
        .from('devices')
        .insert(payload)
        .select('*')
        .single()

      if (error) {
        console.error('❌ Supabase createDevice error:', error)
        console.error('❌ Error code:', error.code)
        console.error('❌ Error details:', error.details)
        console.error('❌ Error hint:', error.hint)
        console.error('❌ Payload sent:', payload)
        throw new Error(`Failed to create device: ${error.message || error.details || JSON.stringify(error)}`)
      }

      console.log('✅ Device created successfully:', device?.id)

      // If device has defects, create a repair record in Supabase
      if (_metaData?.sourceDefects?.length > 0) {
        await supabase
          .from('repairs')
          .insert({
            device_id: device?.id,
          repairType: "refurb_stock",
          dateBrought: new Date().getTime().toString(),
            defects: _metaData.sourceDefects,
        })
      }

      // Resolve color and storage from variant to match getDevices format
      let resolvedColor = null
      let resolvedStorage = null
      let variantData = null

      if (device.variant_id) {
        // Fetch variant to get colors/storages
        const { data: variant } = await supabase
          .from('variants')
          .select('id, brand, model, deviceType, colors, storages')
          .eq('id', device.variant_id)
          .single()
        
        variantData = variant

            // Resolve color
            if (device.color && variant?.colors) {
              const colorObj = Array.isArray(variant.colors)
                ? variant.colors.find((c) => String(c._id || c.id) === String(device.color))
                : null
              if (colorObj) {
                resolvedColor = {
                  id: colorObj._id || colorObj.id,
                  label: colorObj.label,
                  images: colorObj.images || [],
                  primaryIndex: colorObj.primaryIndex || 0,
                }
              }
            }

        // Resolve storage
        if (device.storage && variant?.storages) {
          const storageObj = Array.isArray(variant.storages)
            ? variant.storages.find((s) => String(s._id || s.id) === String(device.storage))
            : null
          if (storageObj) {
            resolvedStorage = {
              id: storageObj._id || storageObj.id,
              label: storageObj.label,
            }
          }
        }
      }

      // Return device in the same format as getDevices
      return {
        ...device,
        variant: variantData ? {
          id: variantData.id,
          brand: variantData.brand,
          model: variantData.model,
          deviceType: variantData.deviceType,
        } : null,
        color: resolvedColor,
        storage: resolvedStorage,
        createdAt: device.created_at || new Date().toISOString(),
      }
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

      let _metaData = JSON.parse(metadata || '{}')

      // Fetch variant to get model and brand if variant is being updated
      let variantModel = null
      let variantBrand = null
      if (variant) {
        const { data: variantData, error: variantError } = await supabase
          .from('variants')
          .select('model, brand')
          .eq('id', variant)
          .single()
        
        if (variantError || !variantData) {
          throw new Error(`Variant not found: ${variantError?.message || 'Invalid variant ID'}`)
        }
        
        variantModel = variantData?.model
        variantBrand = variantData?.brand
      } else {
        // If variant not provided, fetch current device to get existing model/brand
        const { data: currentDevice } = await supabase
          .from('devices')
          .select('model, brand, variant_id')
          .eq('id', id)
          .single()
        
        variantModel = currentDevice?.model
        variantBrand = currentDevice?.brand
        
        // If variant_id exists but variant wasn't provided, use existing variant_id
        if (!variant && currentDevice?.variant_id) {
          // Keep existing variant_id, model, brand
        }
      }

      // Validate IMEI uniqueness (excluding current device)
      if (imei !== undefined) {
        const { data: existingDeviceByImei, error: imeiCheckError } = await supabase
          .from('devices')
          .select('id, imei')
          .eq('imei', imei)
          .neq('id', id) // Exclude current device
          .limit(1)
        
        if (!imeiCheckError && existingDeviceByImei && existingDeviceByImei.length > 0) {
          throw new Error(`A device with IMEI "${imei}" already exists in the inventory. IMEI must be unique.`)
        }
      }

      // Validate Serial Number uniqueness (excluding current device)
      if (serial !== undefined) {
        const { data: existingDeviceBySerial, error: serialCheckError } = await supabase
          .from('devices')
          .select('id, serialNo')
          .eq('serialNo', serial)
          .neq('id', id) // Exclude current device
          .limit(1)
        
        if (!serialCheckError && existingDeviceBySerial && existingDeviceBySerial.length > 0) {
          throw new Error(`A device with Serial Number "${serial}" already exists in the inventory. Serial number must be unique.`)
        }
      }

      const payload = {
        ...(imei !== undefined && { imei }),
        ...(variant && { variant_id: variant }),
        ...(variantModel && { model: variantModel }),
        ...(variantBrand && { brand: variantBrand }),
        ...(storage !== undefined && { storage }),
        ...(color !== undefined && { color }),
        ...(serial !== undefined && { serialNo: serial }),
        ...(metadata && { metadata: _metaData }),
        ...(buyBackPrice !== undefined && { buyBackPrice }),
        ...(grade !== undefined && { grade }),
      }

      console.log('🔍 Updating device with payload:', JSON.stringify(payload, null, 2))

      const { data: device, error } = await supabase
        .from('devices')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        console.error('❌ Supabase editDevice error:', error)
        console.error('❌ Error code:', error.code)
        console.error('❌ Error details:', error.details)
        console.error('❌ Payload sent:', payload)
        throw new Error(`Failed to update device: ${error.message || error.details || JSON.stringify(error)}`)
      }

      console.log('✅ Device updated successfully:', device?.id)

      return device
    },

    addToCart: async (_, args) => {
      const { email, variant, storage, color, device } = args

      if (!email) {
        throw new Error('Email is required')
      }

      // Get current user
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (fetchError || !currentUser) {
        console.error('❌ Error fetching user for addToCart:', fetchError)
        throw new Error(`User not found: ${fetchError?.message || 'Unknown error'}`)
      }

      // Generate a unique ID for the cart item
      const generateId = () => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      let cartItem
      if (!device) {
        cartItem = {
          _id: generateId(),
          variant,
          storage,
          color,
        }
      } else {
        cartItem = {
          _id: generateId(),
          device,
        }
      }

      // Add item to cart
      const updatedCart = [...(currentUser.cart || []), cartItem]
      
      console.log('🔍 Adding item to cart:', {
        email,
        cartItemId: cartItem._id,
        cartLength: updatedCart.length
      })
      
      const { data: user, error: updateError } = await supabase
        .from('users')
        .update({ cart: updatedCart })
        .eq('email', email)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating cart:', updateError)
        throw new Error(`Failed to add item to cart: ${updateError.message}`)
      }

      if (!user) {
        throw new Error('Failed to update user: No data returned')
      }

      console.log('✅ Item added to cart successfully')
      return user
    },

    removeFromCart: async (_, args) => {
      const { email, id } = args

      if (!email) {
        throw new Error('Email is required')
      }

      // Get current user
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (fetchError || !currentUser) {
        console.error('❌ Error fetching user for removeFromCart:', fetchError)
        throw new Error(`User not found: ${fetchError?.message || 'Unknown error'}`)
      }

      const cart = currentUser.cart || []
      
      if (cart.length === 0) {
        console.log('⚠️ Cart is already empty')
        return currentUser
      }

      // Forceful removal: Try multiple matching strategies
      let updatedCart
      
      if (id) {
        // Strategy 1: Match by ID (primary method)
        updatedCart = cart.filter(item => {
          const itemId = item._id || item.id
          return String(itemId) !== String(id)
        })
        
        // If ID matching didn't remove anything, try index-based removal
        if (updatedCart.length === cart.length) {
          console.log('⚠️ ID match failed, trying index-based removal')
          // Try to find by index if id is a number
          const index = parseInt(id)
          if (!isNaN(index) && index >= 0 && index < cart.length) {
            updatedCart = cart.filter((_, i) => i !== index)
            console.log('✅ Removed item by index:', index)
          } else {
            // Strategy 2: If ID doesn't match, remove first item (last resort)
            console.log('⚠️ No ID match found, removing first item as fallback')
            updatedCart = cart.slice(1)
          }
        }
      } else {
        // No ID provided, remove first item
        console.log('⚠️ No ID provided, removing first item')
        updatedCart = cart.slice(1)
      }

      // Safety check: ensure we actually removed something
      if (updatedCart.length === cart.length && cart.length > 0) {
        // Force remove the first item as last resort
        console.log('⚠️ Force removing first cart item')
        updatedCart = cart.slice(1)
      }

      console.log('🔍 Removing item from cart:', {
        originalCartLength: cart.length,
        updatedCartLength: updatedCart.length,
        itemIdToRemove: id,
        removed: cart.length - updatedCart.length
      })
      
      const { data: user, error: updateError } = await supabase
        .from('users')
        .update({ cart: updatedCart })
        .eq('email', email)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating cart:', updateError)
        throw new Error(`Failed to remove item from cart: ${updateError.message}`)
      }

      if (!user) {
        throw new Error('Failed to update user: No data returned')
      }

      console.log('✅ Item removed from cart successfully')
      return user
    },

    editShipping: async (_, args) => {
      const { id, building, suite, street, town } = args

      if (!id) {
        throw new Error('User ID is required')
      }

      // Get current user to preserve existing shipping data
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('shipping')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching user for editShipping:', fetchError)
        throw new Error(`User not found: ${fetchError.message}`)
      }

      // Build shipping object - preserve existing values, update new ones
      const currentShipping = currentUser?.shipping || {}
      const shipping = {
        ...currentShipping,
        ...(building !== undefined && building !== null && { building }),
        ...(suite !== undefined && suite !== null && { suite }),
        ...(street !== undefined && street !== null && { street }),
        ...(town !== undefined && town !== null && { town }),
      }

      console.log('🔍 Updating shipping:', {
        userId: id,
        shipping
      })

      const { data: user, error: updateError } = await supabase
        .from('users')
        .update({ shipping })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating shipping:', updateError)
        throw new Error(`Failed to update shipping: ${updateError.message}`)
      }

      if (!user) {
        throw new Error('Failed to update user: No data returned')
      }

      console.log('✅ Shipping updated successfully')
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
      // Hard delete the variant and return the deleted row
      const { data, error } = await supabase
        .from('variants')
        .delete()
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
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

      const normalizeArrayOfObjects = (arr = [], type = 'color') => {
        try {
          const parsed = Array.isArray(arr) ? arr : JSON.parse(arr || '[]')
          return parsed.map((item) => {
            const asObj = typeof item === 'object' && item !== null ? item : { _id: String(item), label: String(item) }
            const idCandidate = asObj._id ?? asObj.id ?? (asObj.id && asObj.id.$oid) ?? asObj.label
            const normalizedId = String(idCandidate)
            if (type === 'color') {
              return {
                _id: normalizedId,
                label: asObj.label ?? normalizedId,
                colorCode: asObj.colorCode ?? '#FFFFFF',
                images: Array.isArray(asObj.images) ? asObj.images : [],
              }
            }
            return {
              _id: normalizedId,
              label: asObj.label ?? normalizedId,
              price: typeof asObj.price === 'number' ? asObj.price : parseInt(asObj.price ?? 0, 10) || 0,
            }
          })
        } catch (e) {
          return []
        }
      }

      const payload = {
          tradeInAllowed,
          deviceType,
          brand,
          model,
        technicalSpecifications: JSON.parse(technicalSpecifications || '[]'),

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
        colors: normalizeArrayOfObjects(colors, 'color'),
        storages: normalizeArrayOfObjects(storages, 'storage'),

          financing,
          featured,
      }

      const { data, error } = await supabase
        .from('variants')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },

    updateRepair: async (_, args) => {
      const { id, partsBought, serviceCost, repairedBy, dateFixed } = args

      const payload = {
        ...(partsBought && { partsBought: JSON.parse(partsBought || '[]') }),
        ...(serviceCost !== undefined && { serviceCost }),
        ...(repairedBy && { repairedBy }),
        ...(dateFixed && { dateFixed }),
        updated_at: new Date().toISOString(),
      }

      const { data: repair, error } = await supabase
        .from('repairs')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        console.error('❌ Error updating repair:', error)
        throw new Error(`Failed to update repair: ${error.message}`)
      }

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
      } = args

      try {
        // First, get the device to get its variant_id, storage, color
        const { data: deviceData, error: deviceError } = await supabase
          .from('devices')
          .select('id, variant_id, storage, color, status')
          .eq('id', deviceId)
          .single()

        if (deviceError || !deviceData) {
          console.error('❌ Error fetching device:', deviceError)
          throw new Error(`Device not found: ${deviceError?.message || 'Unknown error'}`)
        }

        // Check if device is already sold
        if (deviceData.status === 'Sold') {
          throw new Error('Device is already sold')
        }

        // Get variant to get model name for order items
        const { data: variantData } = await supabase
          .from('variants')
          .select('id, model, storages, colors')
          .eq('id', deviceData.variant_id)
          .single()

        // Resolve storage and color labels
        const storage = Array.isArray(variantData?.storages)
          ? variantData.storages.find((s) => String(s.id || s._id) === String(deviceData.storage))
          : null
        const color = Array.isArray(variantData?.colors)
          ? variantData.colors.find((c) => String(c.id || c._id) === String(deviceData.color))
          : null

        // Create order items summary
        const orderItems = [{
          variant: variantData?.model || 'Unknown',
          storage: storage?.label || 'Unknown',
          color: color?.label || 'Unknown',
          quantity: 1,
          price: sellPrice || 0
        }]

        // Build saleInfo object
        const saleInfo = {
          saleVia: 'walk in',
          customer: customerId || null,
          customerName: customerName || null,
          customerPhoneNumber: customerPhoneNumber || null,
          compliments: compliments || [],
          payment: {
            mode: paymentMode || null,
            amount: sellPrice || 0,
            timestamp: sellDate || new Date().getTime().toString(),
            codes: txCodes || [],
            financing: financingOption || null,
          }
        }

        // Create order in Supabase
        const orderData = {
          variant_id: deviceData.variant_id,
          device_id: deviceId,
          user_id: customerId || null,
          total: sellPrice || 0,
          items: orderItems,
          storage: deviceData.storage,
          color: deviceData.color,
          saleInfo: saleInfo,
          created_at: new Date().toISOString(),
        }

        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single()

        if (orderError) {
          console.error('❌ Error creating order:', orderError)
          throw new Error(`Failed to create order: ${orderError.message}`)
        }

        // Mark device as Sold
        const { data: updatedDevice, error: updateError } = await supabase
          .from('devices')
          .update({ status: 'Sold' })
          .eq('id', deviceId)
          .select('*')
          .single()

        if (updateError) {
          console.error('❌ Error updating device status:', updateError)
          // Order was created but device status update failed - this is a problem
          throw new Error(`Order created but failed to mark device as Sold: ${updateError.message}`)
        }

        console.log('✅ Offline sale recorded successfully:', {
          orderId: insertedOrder.id,
          deviceId: updatedDevice.id,
          status: updatedDevice.status
        })

        return updatedDevice
      } catch (error) {
        console.error('❌ Error in sellDevice:', error)
        throw error
      }
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
