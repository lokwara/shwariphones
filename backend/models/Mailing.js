import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const { Schema } = mongoose;

const MailingSchema = new Schema(
  {
    email: String,
  },
  {
    collection: "Mailings",
  }
);

MailingSchema.plugin(timestamps);

MailingSchema.index({ createdAt: 1, updatedAt: 1 });
export const Mailing = mongoose.model("Mailing", MailingSchema);
