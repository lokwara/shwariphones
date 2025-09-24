import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    isAdmin: { default: false, type: Boolean },
    adminRights: [String],
    name: String,
    email: String,
    cart: [
      {
        variant: { type: Schema.Types.ObjectId, ref: "Variant" },
        storage: Schema.Types.ObjectId,
        color: Schema.Types.ObjectId,
        device: { type: Schema.Types.ObjectId, ref: "Device" },
      },
    ],
    emailVerified: Boolean,
    image: String,
    shipping: Schema.Types.Mixed,
    phoneNumber: String,
    verificationToken: String,
    phoneVerified: { type: Boolean, default: false },
    adminSince: String,
    rulesSetBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    collection: "users",
  }
);

UserSchema.plugin(timestamps);

UserSchema.index({ createdAt: 1, updatedAt: 1 });

export const User = mongoose.model("User", UserSchema);
