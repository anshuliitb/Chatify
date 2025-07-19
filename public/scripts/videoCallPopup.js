const videoPopup = document.getElementById("videoPopup");
const closePopupBtn = document.getElementById("closePopupBtn");

// Show popup when user clicked
export function showVideoPopup(socketId) {
  videoPopup.classList.remove("hidden");

  videoPopup.dataset.socketId = socketId;
}

// Close popup
closePopupBtn.addEventListener("click", () => {
  videoPopup.classList.add("hidden");
});
