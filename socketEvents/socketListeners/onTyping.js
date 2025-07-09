export default function onTyping(socket) {
  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });
}
