export const registerWebRTCListeners = (socket) => {
  socket.on("offer", ({ offer, to, username }) => {
    socket.to(to).emit("offer", { offer, from: socket.id, username });
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

  socket.on("call-declined", ({ to, username }) => {
    socket.to(to).emit("call-declined", { to, username });
    console.log("at server", username);
  });
};
