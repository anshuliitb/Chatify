const msgTune = new Audio("/assets/sounds/msg.mp3");
msgTune.volume = 0.5;

export default function onMsgSound() {
  msgTune.play().catch((err) => console.error("Message sound failed:", err));
}
