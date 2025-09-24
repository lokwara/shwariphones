import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const { Schema } = mongoose;

const FinanceRequestSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "User" },
    variant: { type: Schema.Types.ObjectId, ref: "Variant" },
    color: Schema.Types.ObjectId,
    storage: Schema.Types.ObjectId,
    date: String,
    financer: String, // can be "chanteq" or "buySimu"
    status: String,
  },
  {
    collection: "FinanceRequests",
  }
);

FinanceRequestSchema.plugin(timestamps);

FinanceRequestSchema.index({ createdAt: 1, updatedAt: 1 });
export const FinanceRequest = mongoose.model(
  "FinanceRequest",
  FinanceRequestSchema
);
