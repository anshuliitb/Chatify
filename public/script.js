const socket = io();
const overlay = document.getElementById("overlay");
const startChat = document.getElementById("startChat");
const usernameInput = document.getElementById("usernameInput");
const welcomeMsg = document.getElementById("welcomeMsg");
const chatContainer = document.getElementById("chatContainer");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const userList = document.getElementById("userList");
const typingIndicator = document.getElementById("typingIndicator");
const toggleUsers = document.getElementById("toggleUsers");

let username = "";
let typingTimeout = null;

const joinTune = new Audio("/sounds/join.wav");
const msgTune = new Audio("/sounds/msg.mp3");
joinTune.volume = 0.5;
msgTune.volume = 0.5;

startChat.addEventListener("click", () => {
  username = usernameInput.value.trim();
  if (username) {
    socket.emit("join", { username });
    overlay.style.display = "none";
    chatContainer.style.display = "flex";
    welcomeMsg.innerText = `Welcome, ${username}!`;
  }
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = messageInput.value.trim();
  if (msg) {
    socket.emit("chatMessage", msg);
    messageInput.value = "";
    stopTyping();
  }
});

messageInput.addEventListener("input", () => {
  socket.emit("typing", username);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(stopTyping, 1000);
});

function stopTyping() {
  socket.emit("stopTyping", username);
}

socket.on("joinSound", () => {
  joinTune.play().catch((err) => console.error("Playback failed:", err));
});
socket.on("msgSound", () => {
  msgTune.play().catch((err) => console.error("Playback failed:", err));
});

socket.on("message", ({ username, message, time, profilePic }) => {
  const msgEl = document.createElement("div");
  msgEl.classList.add("message");

  msgEl.innerHTML = `
    <img src="${profilePic}" alt="User" />
    <div class="message-content">
      <div class="meta"><strong>${username}</strong> • ${time}</div>
      <div>${message}</div>
    </div>
  `;
  messages.appendChild(msgEl);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("systemMessage", (text) => {
  const sysMsgEl = document.createElement("div");
  sysMsgEl.classList.add("system-message");
  sysMsgEl.innerText = text;
  messages.appendChild(sysMsgEl);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("updateUserList", (users) => {
  userList.innerHTML = "";
  users.forEach((user) => {
    const userEl = document.createElement("div");
    userEl.classList.add("user-item");

    userEl.innerHTML = `
      <span class="online-dot"></span>
      <span class="user-name">${user.username}</span>
    `;

    userList.appendChild(userEl);
  });
});

socket.on("typing", (user) => {
  typingIndicator.innerText = `${user} is typing...`;
});

socket.on("stopTyping", () => {
  typingIndicator.innerText = "";
});

toggleUsers.addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("hidden");
});
