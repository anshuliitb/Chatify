import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { registerSocketListeners } from "./src/features/socketEvents/socketEvents/registerSocketListeners.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Manage users
let users = [];
const getUsers = () => users;
const setUsers = (updater) => {
  users = typeof updater === "function" ? updater(users) : updater;
};

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("✔️  Client connected with socket ID:", socket.id);
  registerSocketListeners(io, socket, getUsers, setUsers);

  // -----

  socket.on("offer", ({ offer, to }) => {
    socket.to(to).emit("offer", { offer, from: socket.id });
  });

  socket.on("answer", ({ answer, to }) => {
    socket.to(to).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    socket.to(to).emit("ice-candidate", { candidate });
  });

  socket.on("hang-up", ({ to }) => {
    socket.to(to).emit("hang-up");
  });

  socket.on("call-declined", ({ to }) => {
    socket.to(to).emit("call-declined", { from: socket.id });
  });

  // -------

  socket.on("disconnect", () => {
    console.log("✖️  Client disconnected with socket ID:", socket.id);
  });
});

export default server;
