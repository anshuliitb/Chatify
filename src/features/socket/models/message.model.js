import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    username: String,
    message: String,
    time: String,
    profilePic: String,
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
