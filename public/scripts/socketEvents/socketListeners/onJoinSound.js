const joinTune = new Audio("/assets/sounds/join.wav");
joinTune.volume = 0.5;

export default function onJoinSound() {
  joinTune.play().catch((err) => console.error("Join sound failed:", err));
}
