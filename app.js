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

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Users memory store
let users = [];

io.on("connection", async (socket) => {
  console.log("🔌 New client connected");

  // Send chat history to newly connected user
  const messages = await Message.find().sort({ createdAt: 1 }).limit(100);
  messages.forEach((msg) => {
    socket.emit("message", msg);
  });

  // Handle user join
  socket.on("join", ({ username }) => {
    const profilePic = `https://api.dicebear.com/6.x/bottts-neutral/svg?seed=${username}`;
    const user = { id: socket.id, username, profilePic };
    users.push(user);

    socket.broadcast.emit("message", {
      username: "System",
      message: `${username} has joined the chat.`,
      time: new Date().toLocaleTimeString(),
      profilePic: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    });

    io.emit("updateUserList", users);
  });

  // Handle chat message
  socket.on("chatMessage", async (msg) => {
    const user = users.find((u) => u.id === socket.id);
    const chat = {
      username: user.username,
      message: msg,
      time: new Date().toLocaleTimeString(),
      profilePic: user.profilePic,
    };

    // Save to DB
    await Message.create(chat);

    // Broadcast to all
    io.emit("message", chat);
  });

  // Typing events
  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("stopTyping");
  });

  // User disconnect
  socket.on("disconnect", () => {
    const user = users.find((u) => u.id === socket.id);
    users = users.filter((u) => u.id !== socket.id);
    io.emit("updateUserList", users);

    if (user) {
      io.emit("message", {
        username: "System",
        message: `${user.username} left the chat.`,
        time: new Date().toLocaleTimeString(),
        profilePic: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
      });
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://13.61.12.131:${PORT}/`);
});
