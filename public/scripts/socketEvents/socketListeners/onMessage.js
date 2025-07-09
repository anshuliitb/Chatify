export default function onMessage({ username, message, time, profilePic }) {
  const messages = document.getElementById("messages");

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
}
