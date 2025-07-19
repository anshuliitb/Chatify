export default function onDisconnect(socket, io, getUsers, setUsers) {
  socket.on("disconnect", () => {
    const user = getUsers().find((u) => u.id === socket.id);
    setUsers((prev) => prev.filter((u) => u.id !== socket.id));
    io.emit("updateUserList", getUsers());

    if (user) {
      io.emit("systemMessage", `${user.username} left the chat`);
    }
  });
}
