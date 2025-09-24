import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const { Schema } = mongoose;

const RepairSchema = new Schema(
  {
    repairType: String, // Warranty , RepairPro , Refurbished Stock
    repairedBy: String,
    dateFixed: String,
    dateBrought: String,
    serviceCost: { type: Number, default: 0 },
    defects: [String],
    partsBought: [
      {
        part: String,
        cost: Number,
      },
    ],
    imei: String,
    variant: String,
    device: { type: Schema.Types.ObjectId, ref: "Device" },
    serialNo: String,
    customer: {
      name: String,
      phoneNumber: String,
    },
  },
  {
    collection: "Repairs",
  }
);

RepairSchema.plugin(timestamps);

RepairSchema.index({ createdAt: 1, updatedAt: 1 });
export const Repair = mongoose.model("Repair", RepairSchema);
