import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { registerChattingListeners } from "./src/features/socket/socketEvents/registerChattingListeners.js";
import { registerWebRTCListeners } from "./src/features/socket/socketEvents/registerWebRTCListeners.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Users state
let users = [];
const getUsers = () => users;
const setUsers = (updater) => {
  users = typeof updater === "function" ? updater(users) : updater;
};

// Handle socket connections
io.on("connection", (socket) => {
  console.log("✔️  Client connected:", socket.id);

  registerChattingListeners(io, socket, getUsers, setUsers);
  registerWebRTCListeners(socket);

  socket.on("disconnect", () => {
    console.log("✖️  Client disconnected:", socket.id);
  });
});

export default server;
