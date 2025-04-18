import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  token: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["reset_password", "email_verification"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Token expires in 1 hour (3600 seconds)
  },
});

const Token = mongoose.model("Token", TokenSchema);
export default Token;
