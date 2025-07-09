export default function onUpdateUserList(users) {
  const userList = document.getElementById("userList");
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
}
