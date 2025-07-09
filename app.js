import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Message } from "./models/Message.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

let users = [];

io.on("connection", async (socket) => {
  console.log("🔌 New client connected");

  socket.on("join", async ({ username }) => {
    const profilePic = `https://api.dicebear.com/6.x/bottts-neutral/svg?seed=${username}`;
    const user = { id: socket.id, username, profilePic };
    users.push(user);

    socket.broadcast.emit("systemMessage", `${username} joined the chat`);
    io.emit("updateUserList", users);

    const messages = await Message.find().sort({ createdAt: 1 }).limit(100);
    messages.forEach((msg) => {
      socket.emit("message", msg);
    });

    socket.broadcast.emit("joinSound");
  });

  socket.on("chatMessage", async (msg) => {
    const user = users.find((u) => u.id === socket.id);
    const chat = {
      username: user.username,
      message: msg,
      time: new Date().toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
      profilePic: user.profilePic,
    };

    await Message.create(chat);
    io.emit("message", chat);

    socket.broadcast.emit("msgSound");
  });

  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("stopTyping");
  });

  socket.on("disconnect", () => {
    const user = users.find((u) => u.id === socket.id);
    users = users.filter((u) => u.id !== socket.id);
    io.emit("updateUserList", users);

    if (user) {
      io.emit("systemMessage", `${user.username} left the chat`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://13.61.12.131:${PORT}/`);
});
