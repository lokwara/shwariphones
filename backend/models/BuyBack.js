import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const { Schema } = mongoose;

const PaymentSchema = new Schema({
  mode: String,
  amount: Number,
  timestamp: String,
  code: String,
});

const BuyBackSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    variant: { type: Schema.Types.ObjectId, ref: "Variant" },
    storage: String,
    color: String,
    imei: String,
    serialNo: String,

    // screenCondition: String,
    // bodyCondition: String,
    // speakerReplaced: Boolean,
    // earpieceReplaced: Boolean,
    // cameraReplaced: Boolean,
    // bodyReplaced: Boolean,
    // batteryReplaced: Boolean,
    // functional: Boolean,

    batteryHealth: Number,
    frontCamOk: Boolean,
    backCamOk: Boolean,
    earpieceOk: Boolean,
    mouthpieceOk: Boolean,
    speakerOk: Boolean,
    authorizationOk: Boolean,
    simTrayPresent: Boolean,
    chargingOk: Boolean,
    screenCondition: String,
    sideNBackCondition: String,

    offer: Number,
    payment: PaymentSchema,
    cancelled: { type: Boolean, default: false },
  },
  {
    collection: "BuyBacks",
  }
);

BuyBackSchema.plugin(timestamps);

BuyBackSchema.index({ createdAt: 1, updatedAt: 1 });

export const BuyBack = mongoose.model("BuyBack", BuyBackSchema);
