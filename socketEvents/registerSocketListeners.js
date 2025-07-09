import onJoin from "./socketListeners/onJoin.js";
import onChatMessage from "./socketListeners/onChatMessage.js";
import onTyping from "./socketListeners/onTyping.js";
import onStopTyping from "./socketListeners/onStopTyping.js";
import onDisconnect from "./socketListeners/onDisconnect.js";

export function registerSocketListeners(io, socket, users, setUsers) {
  onJoin(socket, io, users, setUsers);
  onChatMessage(socket, io, users);
  onTyping(socket);
  onStopTyping(socket);
  onDisconnect(socket, io, users, setUsers);
}
