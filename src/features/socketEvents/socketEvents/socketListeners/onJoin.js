import { Message } from "../../models/message.model.js";

export default async function onJoin(socket, io, getUsers, setUsers) {
  socket.on("join", async ({ username }) => {
    const profilePic = `https://api.dicebear.com/6.x/bottts-neutral/svg?seed=${username}`;
    const newUser = { id: socket.id, username, profilePic };
    setUsers((prev) => [...prev, newUser]);

    socket.broadcast.emit("systemMessage", `${username} joined the chat`);

    socket.emit("setMySocketId", socket.id);

    io.emit("updateUserList", getUsers());

    const messages = await Message.find().sort({ createdAt: 1 }).limit(100);
    messages.forEach((msg) => {
      socket.emit("message", msg);
    });

    socket.broadcast.emit("joinSound");
  });
}
