import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

import "dotenv/config";

const { Schema } = mongoose;

const MetadataSchema = new Schema({
  sourceType: String, // Import or BuyBack
  sourceName: String,
  sourceDefects: [String],
  purchaseDate: String,
});

const DeviceSchema = new Schema(
  {
    serialNo: String,
    imei: String,
    variant: { type: Schema.Types.ObjectId, ref: "Variant" },
    storage: Schema.Types.ObjectId,
    color: Schema.Types.ObjectId,
    metadata: MetadataSchema,
    buyBackPrice: Number,
    grade: String,
    status: { type: String, default: "Available" },
    offer: {
      info: { type: Schema.Types.ObjectId, ref: "Offer" },
      price: Number,
    },
  },
  {
    collection: "Devices",
  }
);
DeviceSchema.index({ createdAt: 1, updatedAt: 1 });

DeviceSchema.plugin(timestamps);

let Device = mongoose.model("Device", DeviceSchema);

export { Device };
