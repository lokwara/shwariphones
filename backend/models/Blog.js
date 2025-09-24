import mongoose from "mongoose"
import timestamps from "mongoose-timestamp"

const { Schema } = mongoose

const BlogSchema = new Schema(
  {
    thumbnail: String,
    title: String,
    category: String,
    content: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: "Blogs",
  }
)

BlogSchema.plugin(timestamps)

BlogSchema.index({ createdAt: 1, updatedAt: 1 })
export const Blog = mongoose.model("Blog", BlogSchema)
