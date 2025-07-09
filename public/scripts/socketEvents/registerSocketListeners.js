import onJoinSound from "./socketListeners/onJoinSound.js";
import onMsgSound from "./socketListeners/onMsgSound.js";
import onMessage from "./socketListeners/onMessage.js";
import onSystemMessage from "./socketListeners/onSystemMessage.js";
import onUpdateUserList from "./socketListeners/onUpdateUserList.js";
import onTyping from "./socketListeners/onTyping.js";
import onStopTyping from "./socketListeners/onStopTyping.js";

export function registerSocketListeners(socket) {
  socket.on("joinSound", onJoinSound);
  socket.on("msgSound", onMsgSound);
  socket.on("message", onMessage);
  socket.on("systemMessage", onSystemMessage);
  socket.on("updateUserList", onUpdateUserList);
  socket.on("typing", onTyping);
  socket.on("stopTyping", onStopTyping);
}
