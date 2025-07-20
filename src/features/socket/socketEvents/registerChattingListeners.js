import onJoin from "./socketListeners/onJoin.js";
import onChatMessage from "./socketListeners/onChatMessage.js";
import onTyping from "./socketListeners/onTyping.js";
import onStopTyping from "./socketListeners/onStopTyping.js";
import onDisconnect from "./socketListeners/onDisconnect.js";

export function registerChattingListeners(io, socket, getUsers, setUsers) {
  onJoin(socket, io, getUsers, setUsers);
  onChatMessage(socket, io, getUsers);
  onTyping(socket);
  onStopTyping(socket);
  onDisconnect(socket, io, getUsers, setUsers);
}
