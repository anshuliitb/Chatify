import onJoinSound from "./socketListeners/onJoinSound.js";
import onMsgSound from "./socketListeners/onMsgSound.js";
import onMessage from "./socketListeners/onMessage.js";
import onSystemMessage from "./socketListeners/onSystemMessage.js";
import onUpdateUserList from "./socketListeners/onUpdateUserList.js";
import onTyping from "./socketListeners/onTyping.js";
import onStopTyping from "./socketListeners/onStopTyping.js";

let mySocketId = null;

export function registerSocketListeners(socket) {
  socket.on("joinSound", onJoinSound);
  socket.on("msgSound", onMsgSound);
  socket.on("message", onMessage);
  socket.on("systemMessage", onSystemMessage);
  // ✅ Save your own socket ID once
  socket.on("setMySocketId", (id) => {
    mySocketId = id;
  });
  socket.on("updateUserList", (users) => {
    onUpdateUserList(users, mySocketId);
  });
  socket.on("typing", onTyping);
  socket.on("stopTyping", onStopTyping);
}
