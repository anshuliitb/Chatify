import { showVideoPopup } from "../../videoCallPopup.js";

export default function onUpdateUserList(users, mySocketId) {
  const userList = document.getElementById("userList");
  userList.innerHTML = "";

  users.forEach((user) => {
    const userEl = document.createElement("div");
    userEl.classList.add("user-item");

    userEl.dataset.socketId = user.id;

    userEl.innerHTML = `
      <div class="user-info">
        <div class="user-left">
          <span class="online-dot"></span>
          <span class="user-name">${user.username}</span>
        </div>${
          user.id != mySocketId
            ? '<button class="video-call-btn" title="Video Call"><i class="fas fa-video"></i></button>'
            : ""
        }
      </div>
    `;

    const callBtn = userEl.querySelector(".video-call-btn");
    if (callBtn) {
      callBtn.addEventListener("click", () => {
        const socketId = user.id;
        showVideoPopup(socketId);
      });
    }

    userList.appendChild(userEl);
  });
}
