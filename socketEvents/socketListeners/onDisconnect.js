export default function onDisconnect(socket, io, users, setUsers) {
  socket.on("disconnect", () => {
    const user = users().find((u) => u.id === socket.id);
    setUsers((prev) => prev.filter((u) => u.id !== socket.id));
    io.emit("updateUserList", users());

    if (user) {
      io.emit("systemMessage", `${user.username} left the chat`);
    }
  });
}
