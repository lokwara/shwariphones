import mongoose from "mongoose"
import timestamps from "mongoose-timestamp"

const { Schema } = mongoose

const OfferSchema = new Schema(
  {
    label: String,
    start: String,
    end: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: "Offers",
  }
)

OfferSchema.plugin(timestamps)

OfferSchema.index({ createdAt: 1, updatedAt: 1 })
export const Offer = mongoose.model("Offer", OfferSchema)
