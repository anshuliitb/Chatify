import { registerUIEmitters } from "./socketEvents/registerUIEmitters.js";
import { registerSocketListeners } from "./socketEvents/registerSocketListeners.js";
import initEmojiPicker from "./socketEvents/emoji.js";
import {
  playRingtone,
  stopRingtone,
} from "./socketEvents/videoCallRingtone.js";

export const socket = io();

registerUIEmitters(socket);
registerSocketListeners(socket);
initEmojiPicker();

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startCallBtn = document.getElementById("callBtn");
const hangUpBtn = document.getElementById("disconnectBtn");

let localStream = null;
let remoteStream = null;
let peerConnection = null;
let bufferedCandidates = [];
let retryTimeout = null;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function createPeerConnection(toSocketId) {
  console.log(
    "🧱 [createPeerConnection] Creating RTCPeerConnection for",
    toSocketId
  );
  peerConnection = new RTCPeerConnection(config);
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      console.log("✅ [ontrack] Track received:", track.kind);
      if (!remoteStream.getTracks().find((t) => t.id === track.id)) {
        console.log(
          "🎥 [ontrack] Adding unique track to remoteStream:",
          track.kind
        );
        remoteStream.addTrack(track);
      }
    });
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("❄️ [onicecandidate] Sending ICE candidate to", toSocketId);
      socket.emit("ice-candidate", {
        candidate: event.candidate,
        to: toSocketId,
      });
    }
  };

  peerConnection.onconnectionstatechange = () => {
    const state = peerConnection.connectionState;
    console.log("🔄 [connectionStateChange]", state);

    if (["disconnected", "failed", "closed"].includes(state)) {
      console.log(
        "⚠️ [connectionStateChange] Triggering retry due to state:",
        state
      );
      scheduleRetryCall();
      disconnectCall();
    }
  };
}

function scheduleRetryCall() {
  if (retryTimeout) clearTimeout(retryTimeout);
  retryTimeout = setTimeout(() => {
    const popup = document.getElementById("videoPopup");
    const toSocketId = popup.dataset.socketId;
    if (toSocketId) {
      console.log("🔁 [retry] Retrying call to", toSocketId);
      startCallBtn.click(); // Trigger call again
    }
  }, 5000);
}

function disconnectCall() {
  console.log("📴 [disconnect] Cleaning up call");
  const popup = document.getElementById("videoPopup");
  popup.classList.add("hidden");

  if (retryTimeout) clearTimeout(retryTimeout);
  retryTimeout = null;

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  if (remoteVideo?.srcObject) {
    remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
    remoteVideo.srcObject = null;
  }

  if (localVideo) {
    localVideo.srcObject = null;
  }

  bufferedCandidates = [];
  startCallBtn.style.display = "inline-block";
}

startCallBtn.onclick = async () => {
  const popup = document.getElementById("videoPopup");

  const toSocketId = popup.dataset.socketId;
  const username = document.getElementById("localUsernameLabel").textContent;
  if (!toSocketId) return alert("Invalid recipient");

  try {
    console.log("📞 [startCall] Initiating call to", toSocketId);

    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    console.log("🎙️ [startCall] Got local media");

    localVideo.srcObject = localStream;
    startCallBtn.style.display = "none";

    createPeerConnection(toSocketId);

    localStream.getTracks().forEach((track) => {
      console.log("📤 [startCall] Adding local track:", track.kind);
      peerConnection.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log("📨 [startCall] Sending offer");

    socket.emit("offer", { offer, to: toSocketId, username });
  } catch (err) {
    console.error("❌ [startCall] Error starting call:", err);
    alert("Could not access camera/mic.");
  }
};

const closeBtn = document.getElementById("closePopupBtn");
closeBtn.onclick = () => {
  const popup = document.getElementById("videoPopup");
  const toSocketId = popup.dataset.socketId;
  if (toSocketId && peerConnection) {
    socket.emit("hang-up", { to: toSocketId });
  }
  disconnectCall();
};

hangUpBtn.onclick = () => {
  const popup = document.getElementById("videoPopup");
  const toSocketId = popup.dataset.socketId;
  socket.emit("hang-up", { to: toSocketId });
  disconnectCall();
};

socket.on("offer", async ({ offer, from, username }) => {
  const popup = document.getElementById("videoPopup");
  const remoteUsernameLabelEl = popup.querySelector("#remoteUsernameLabel");
  remoteUsernameLabelEl.textContent = username;
  const remoteUsernameLabel = remoteUsernameLabelEl.textContent;
  const localUsernameLabel = document.querySelector(
    "#localUsernameLabel"
  ).textContent;

  playRingtone();

  console.log("📞 [offer] Incoming offer from", from, username);
  console.log("local", localUsernameLabel, "remote", remoteUsernameLabel);

  const accept = confirm(`${username} is calling you. Accept the video call?`);
  stopRingtone();

  if (!accept) {
    console.log("🚫 [offer] Call declined by user.");
    socket.emit("call-declined", { to: from, username: localUsernameLabel });
    return;
  }

  try {
    console.log("🎙️ [offer] Getting local media...");
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    console.log("🎥 [offer] Local media acquired.");
    localVideo.srcObject = localStream;

    const popup = document.getElementById("videoPopup");
    popup.classList.remove("hidden");
    popup.dataset.socketId = from;
    startCallBtn.style.display = "none";

    createPeerConnection(from);

    localStream.getTracks().forEach((track) => {
      console.log("📥 [offer] Adding local track:", track.kind);
      peerConnection.addTrack(track, localStream);
    });

    await peerConnection.setRemoteDescription(offer);
    console.log("📩 [offer] Remote description set.");

    bufferedCandidates.forEach((c) => {
      console.log("🧊 [offer] Flushing buffered ICE:", c.candidate.candidate);
      peerConnection
        .addIceCandidate(c.candidate)
        .catch((err) =>
          console.error("❌ [offer] Error adding buffered ICE:", err)
        );
    });
    bufferedCandidates = [];

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log("📨 [offer] Sending answer to", from);

    socket.emit("answer", { answer, to: from });
  } catch (err) {
    console.error("❌ [offer] Error handling offer:", err);
  }
});

socket.on("answer", async ({ answer }) => {
  console.log("📩 [answer] Received answer");
  if (!peerConnection) return console.warn("⚠️ [answer] No peerConnection");
  await peerConnection.setRemoteDescription(answer);
  console.log("✅ [answer] Remote description set");
});

socket.on("ice-candidate", async ({ candidate }) => {
  console.log("📥 [ice-candidate] ICE candidate received");

  if (!peerConnection || !peerConnection.remoteDescription) {
    console.log("🕒 [ice-candidate] Buffering ICE candidate");
    bufferedCandidates.push({ candidate });
  } else {
    try {
      await peerConnection.addIceCandidate(candidate);
      console.log("🧊 [ice-candidate] Added ICE candidate");
    } catch (err) {
      console.error("❌ [ice-candidate] Error adding ICE candidate", err);
    }
  }
});

socket.on("hang-up", () => {
  console.log("📴 [hang-up] Call ended by remote");
  disconnectCall();
  setTimeout(() => {
    alert("📴 Remote user disconnected the call.");
  }, 800);
});

socket.on("call-declined", ({ to, username }) => {
  alert(`Call declined by the ${username}!`);
  console.log("🚫 [call-declined] Call declined by", username);

  disconnectCall();
});

socket.on("disconnect", () => {
  console.log("📡 [socket] Disconnected");
  disconnectCall();
});
