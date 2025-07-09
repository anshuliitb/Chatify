import { Message } from "../../models/message.js";

export default async function onJoin(socket, io, users, setUsers) {
  socket.on("join", async ({ username }) => {
    const profilePic = `https://api.dicebear.com/6.x/bottts-neutral/svg?seed=${username}`;
    const user = { id: socket.id, username, profilePic };
    setUsers((prev) => [...prev, user]);

    socket.broadcast.emit("systemMessage", `${username} joined the chat`);
    io.emit("updateUserList", users());

    const messages = await Message.find().sort({ createdAt: 1 }).limit(100);
    messages.forEach((msg) => {
      socket.emit("message", msg);
    });

    socket.broadcast.emit("joinSound");
  });
}
