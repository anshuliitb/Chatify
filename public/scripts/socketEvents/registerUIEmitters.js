export function registerUIEmitters(socket) {
  const overlay = document.getElementById("overlay");
  const startChat = document.getElementById("startChat");
  const usernameInput = document.getElementById("usernameInput");
  const welcomeMsg = document.getElementById("welcomeMsg");
  const chatContainer = document.getElementById("chatContainer");
  const messageForm = document.getElementById("messageForm");
  const messageInput = document.getElementById("messageInput");
  const toggleUsers = document.getElementById("toggleUsers");

  let username = "";
  let typingTimeout = null;

  startChat.addEventListener("click", () => {
    username = usernameInput.value.trim();
    if (username) {
      socket.emit("join", { username });
      overlay.style.display = "none";
      chatContainer.style.display = "flex";
      welcomeMsg.innerText = `Welcome, ${username}!`;
      const localUsernameLabel = document.getElementById("localUsernameLabel");
      localUsernameLabel.textContent = username;

      // IOS interation fix
      const submitBtn = document.getElementById("submitBtn");
      submitBtn.click();
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

  toggleUsers.addEventListener("click", () => {
    document.querySelector(".sidebar").classList.toggle("hidden");
  });

  function stopTyping() {
    socket.emit("stopTyping", username);
  }
}
