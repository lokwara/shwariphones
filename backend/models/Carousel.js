import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const { Schema } = mongoose;

const CarouselSchema = new Schema(
  {
    smallScreen: String,
    largeScreen: String,
    link: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: "Carousels",
  }
);

CarouselSchema.plugin(timestamps);

CarouselSchema.index({ createdAt: 1, updatedAt: 1 });
export const Carousel = mongoose.model("Carousel", CarouselSchema);
