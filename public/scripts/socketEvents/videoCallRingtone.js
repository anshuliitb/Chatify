let audio = null;

export function playRingtone() {
  if (!audio) {
    audio = new Audio("/assets/sounds/ringtone.mp3");
    audio.loop = true;
  }
  audio.play().catch((err) => console.warn("🔇 Failed to play ringtone:", err));
}

export function stopRingtone() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}
