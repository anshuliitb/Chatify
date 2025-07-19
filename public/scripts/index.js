import { registerUIEmitters } from "./socketEvents/registerUIEmitters.js";
import { registerSocketListeners } from "./socketEvents/registerSocketListeners.js";

export const socket = io();

document.addEventListener("DOMContentLoaded", () => {
  registerUIEmitters(socket);
  registerSocketListeners(socket);
});
