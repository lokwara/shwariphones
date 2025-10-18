import axios from "axios"

import client from "@/lib/db"
import { ObjectId } from "mongodb"

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

export default async function handler(req, res) {
  if (req.method === "POST") {
    let orderData = req.body

    // Get Bearer token
    const auth_data = {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://pay.pesapal.com/v3/api/Auth/RequestToken",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: auth_data,
    }

    const {
      data: { token },
    } = await axios.request(config)

    // Get transaction status
    try {
      const config = {
        method: "get",
        url: `https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderData?.OrderTrackingId}`,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }

      const { data: response } = await axios.request(config)

      if (response.status_code === 1) {
        const user_id = response.merchant_reference.split("-")[0]

        try {
          await client.connect()
          const db = client.db()

          const usersCol = db.collection("users")
          const ordersCol = db.collection("Orders")
          const devicesCol = db.collection("Devices")
          const variantCol = db.collection("Variants")

          let updateFields = {
            saleInfo: {
              saleVia: "website",
              payment: {
                mode: response.payment_method,
                codes: [response.confirmation_code],
                timestamp: new Date().getTime().toString(),
                phoneNumber: "",
                amount: 0,
              },
              customer: new ObjectId(`${user_id}`),
            },
          }

          const user = await usersCol.findOne({
            _id: new ObjectId(`${user_id}`),
          })

          if (!user)
            return res.status(404).json({ message: "Customer not found" })

          const cartItems = user.cart || []
          let orderSummary = ""

          for (const cartItem of cartItems) {
            let orderDoc = { ...updateFields }

            if (!cartItem.device) {
              const variant = await variantCol.findOne({
                _id: new ObjectId(`${cartItem.variant}`),
              })

              const storage = variant.storages?.find(
                (s) => s._id.toString() == cartItem.storage.toString()
              )

              const color = variant.colors?.find(
                (c) => c._id.toString() === cartItem.color.toString()
              )

              if (!variant || !storage || !color) continue

              orderSummary += `${variant.model} - ${storage.label} - ${color.label}\n`
              orderDoc.saleInfo.payment.amount = storage.price

              Object.assign(orderDoc, {
                variant: variant._id,
                storage: cartItem.storage,
                color: cartItem.color,
                createdAt: new Date(),
              })

              await ordersCol.insertOne(orderDoc)
            } else {
              const device = await devicesCol.findOne({
                _id: new ObjectId(`${cartItem.device}`),
              })
              const variant = await variantCol.findOne({
                _id: new ObjectId(`${device.variant}`),
              })

              const storage = variant.storages?.find(
                (s) => s._id.toString() === device.storage.toString()
              )
              const color = variant.colors?.find(
                (c) => c._id.toString() === device.color.toString()
              )

              orderSummary += `${variant.model} - ${storage.label} - ${color.label}\n`
              orderDoc.saleInfo.payment.amount = device.offer?.price

              Object.assign(orderDoc, {
                device: device._id,
                storage: device.storage,
                color: device.color,
                variant: device.variant,
                createdAt: new Date(),
              })

              await devicesCol.updateOne(
                { _id: new ObjectId(`${device._id}`) },
                { $set: { status: "Sold" } }
              )

              await ordersCol.insertOne(orderDoc)
            }
          }

          await usersCol.updateOne(
            { _id: new ObjectId(`${user_id}`) },
            { $set: { cart: [] } }
          )

          try {
            await sendText(
              user?.phoneNumber,
              `Your order has been received and is being processed. You can track the order status from our website under the orders tab. Thank you for trusting us.`
            )

            const adminNumbers = [
              "+254705820802",
              "+254728412853",
              "+254769731531",
              "+254743347459",
              "+254723772024",
              "+254748920306",
            ]

            for (let number of adminNumbers) {
              await sendText(
                number,
                `New website order alert:\n${orderSummary}`
              )
            }
          } catch (error) {
            console.error("SMS sending failed:", error)
          }

          return res.status(200).json({
            orderNotificationType: orderData?.OrderNotificationType,
            orderTrackingId: orderData?.OrderTrackingId,
            orderMerchantReference: orderData?.OrderMerchantReference,
            status: 200,
          })
        } catch (err) {
          console.error("Error recording sale:", err)
          return res
            .status(405)
            .json({ message: "Payment succeeded , order not created" })
        }
      }
    } catch (err) {
      console.log("Error get tx status", err)
      return res.status(405).json({ message: "Pesapal error" })
    }
  }

  return res.status(405).json({ message: "Method not allowed" })
}
