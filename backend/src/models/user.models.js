// models/user.models.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: false,
    },
    // Remove password field - Clerk handles authentication
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
