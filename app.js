import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { registerSocketListeners } from "./socketEvents/registerSocketListeners.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Manage users
let _users = [];
const users = () => _users;
const setUsers = (updater) => {
  _users = typeof updater === "function" ? updater(_users) : updater;
};

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("🔌 Client connected");
  registerSocketListeners(io, socket, users, setUsers);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`🚀 Server running at port: ${PORT}`);
  // Connect to DB
  await connectDB();
});
