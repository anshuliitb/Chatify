export const registerWebRTCListeners = (socket) => {
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
};
