import mongoose from "mongoose"
import timestamps from "mongoose-timestamp"

const { Schema } = mongoose

const TechTipSchema = new Schema(
  {
    link: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: "TechTips",
  }
)

TechTipSchema.plugin(timestamps)

TechTipSchema.index({ createdAt: 1, updatedAt: 1 })
export const TechTip = mongoose.model("TechTip", TechTipSchema)
