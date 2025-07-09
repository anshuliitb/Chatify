export default function onSystemMessage(text) {
  const messages = document.getElementById("messages");
  const sysMsgEl = document.createElement("div");
  sysMsgEl.classList.add("system-message");
  sysMsgEl.innerText = text;
  messages.appendChild(sysMsgEl);
  messages.scrollTop = messages.scrollHeight;
}
