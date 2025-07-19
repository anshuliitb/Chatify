const videoPopup = document.getElementById("videoPopup");
const closePopupBtn = document.getElementById("closePopupBtn");
const callBtn = document.getElementById("callBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// Show popup when user clicked
export function showVideoPopup(userSocketId) {
  videoPopup.classList.remove("hidden");
  // Store target socket ID for call signaling
  videoPopup.dataset.targetSocketId = userSocketId;
}

// Close popup
closePopupBtn.addEventListener("click", () => {
  videoPopup.classList.add("hidden");
  // Stop local stream if any
  if (localVideo.srcObject) {
    localVideo.srcObject.getTracks().forEach((track) => track.stop());
    localVideo.srcObject = null;
  }
  remoteVideo.srcObject = null;
});

// Call button logic
callBtn.addEventListener("click", () => {
  const targetId = videoPopup.dataset.targetSocketId;
  if (targetId) {
    // Start your WebRTC logic here (e.g., create offer)
    startCall(targetId);
  }
});

// Disconnect button logic
disconnectBtn.addEventListener("click", () => {
  endCall();
  closePopupBtn.click();
});
