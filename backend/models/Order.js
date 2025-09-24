import mongoose from "mongoose"
import timestamps from "mongoose-timestamp"

const { Schema } = mongoose

const PaymentSchema = new Schema({
  mode: String,
  amount: Number,
  phoneNumber: String,
  timestamp: String,
  codes: [String],
  financing: String, // can be "chanteq" or "buySimu"
})

const DeliverySchema = new Schema({
  lat: String,
  lng: String,
  dispatchTime: String,
  collectionTime: String,
})

const SaleSchema = new Schema({
  saleVia: String, // can be "walk in" or "website"
  payment: PaymentSchema,
  customerName: String,
  customerPhoneNumber: String,
  customer: { type: Schema.Types.ObjectId, ref: "User" },
  delivery: DeliverySchema,
  recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
  compliments: [String],
})

const ReviewSchema = new Schema({
  review: String,
  rating: Number,
  image: String,
  date: String,
  featured: { type: Boolean, default: false },
  removed: { type: Boolean, default: false },
})

const OrderSchema = new Schema(
  {
    variant: { type: Schema.Types.ObjectId, ref: "Variant" },
    storage: Schema.Types.ObjectId,
    color: Schema.Types.ObjectId,
    device: { type: Schema.Types.ObjectId, ref: "Device" },
    review: ReviewSchema,
    saleInfo: SaleSchema,
  },
  {
    collection: "Orders",
  }
)

OrderSchema.plugin(timestamps)

OrderSchema.index({ createdAt: 1, updatedAt: 1 })

export const Order = mongoose.model("Order", OrderSchema)
