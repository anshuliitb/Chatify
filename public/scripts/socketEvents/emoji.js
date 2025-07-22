export default function initEmojiPicker() {
  const emojiBtn = document.getElementById("emojiBtn");
  const emojiPicker = document.getElementById("emojiPicker");
  const messageInput = document.getElementById("messageInput");

  if (!emojiBtn || !emojiPicker || !messageInput) return;

  // Toggle emoji picker
  emojiBtn.addEventListener("click", () => {
    const isOpen = emojiPicker.style.display === "block";
    emojiPicker.style.display = isOpen ? "none" : "block";
  });

  // Insert emoji on selection
  emojiPicker.addEventListener("emoji-click", (event) => {
    const emoji = event.detail.unicode;
    messageInput.value += emoji;
    emojiPicker.style.display = "none";
  });
}
