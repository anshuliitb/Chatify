import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    username: String,
    message: String,
    profilePic: String,
    time: String,
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.model("Message", messageSchema);
