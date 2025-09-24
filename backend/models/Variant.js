import mongoose from "mongoose"
import timestamps from "mongoose-timestamp"
// import { algoliaIntegration } from "@avila-tek/mongoose-algolia"

const { Schema } = mongoose

const ColorSchema = new Schema({
  label: String,
  colorCode: String,
  images: [String],
  primaryIndex: Number,
})

const StorageSchema = new Schema({
  label: String,
  price: Number,
})

const ReviewSchema = new Schema({
  review: String,
  rating: Number,
  customer: { type: Schema.Types.ObjectId, ref: "User" },
  timestamp: String,
})

const VariantSchema = new Schema(
  {
    tradeInAllowed: Boolean,
    deviceType: String,
    brand: String,
    model: String,
    technicalSpecifications: Schema.Types.Mixed,

    // Trade in pricing params
    screenCost: Number,
    bodyCost: Number,
    frontCamCost: Number,
    backCamCost: Number,
    earpieceCost: Number,
    mouthpieceCost: Number,
    speakerCost: Number,
    authCost: Number,
    simTrayCost: Number,
    motherBoardCost: Number,
    batteryCost: Number,

    // financingRequests: [FinancingRequestSchema],

    colors: [ColorSchema],
    storages: [StorageSchema],
    removed: { type: Boolean, default: false },
    financing: [String],
    featured: { type: Boolean, default: false },

    reviews: [ReviewSchema],
  },
  {
    collection: "Variants",
  }
)

VariantSchema.index({ createdAt: 1, updatedAt: 1 })

VariantSchema.plugin(timestamps)

// VariantSchema.plugin(algoliaIntegration, {
//   appId: process.env.ALGOLIA_APP_ID,
//   apiKey: process.env.ALGOLIA_API_KEY,
//   indexName: process.env.ALGOLIA_INDEX,
//   selector: "-financingRequests",
//   filter: (doc) => {
//     return !doc.removed // Only upload devices where 'status' is true
//   },

//   debug: true,
// })

let Variant = mongoose.model("Variant", VariantSchema)

// Variant.syncToAlgolia()

export { Variant }
