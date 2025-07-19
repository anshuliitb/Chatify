import { Message } from "../../models/message.model.js";

export default function onChatMessage(socket, io, users) {
  socket.on("chatMessage", async (msg) => {
    const user = users().find((u) => u.id === socket.id);
    if (!user) return;

    const chat = {
      username: user.username,
      message: msg,
      time: new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
      profilePic: user.profilePic,
    };

    await Message.create(chat);
    io.emit("message", chat);
    socket.broadcast.emit("msgSound");
  });
}
