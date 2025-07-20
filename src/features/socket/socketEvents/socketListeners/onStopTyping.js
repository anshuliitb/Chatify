export default function onStopTyping(socket) {
  socket.on("stopTyping", () => {
    socket.broadcast.emit("stopTyping");
  });
}
