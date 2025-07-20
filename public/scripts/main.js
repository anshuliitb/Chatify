import { registerUIEmitters } from "./socketEvents/registerUIEmitters.js";
import { registerSocketListeners } from "./socketEvents/registerSocketListeners.js";

export const socket = io();

registerUIEmitters(socket);
registerSocketListeners(socket);

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const startCallBtn = document.getElementById("callBtn");
const hangUpBtn = document.getElementById("disconnectBtn");

let localStream = null;
let remoteStream = null;
let peerConnection = null;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function createPeerConnection(toSocketId) {
  peerConnection = new RTCPeerConnection(config);
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        candidate: event.candidate,
        to: toSocketId,
      });
    }
  };

  peerConnection.onconnectionstatechange = () => {
    const state = peerConnection.connectionState;
    console.log("Connection State:", state);
    if (["disconnected", "failed", "closed"].includes(state)) {
      disconnectCall();
    }
  };
}

function disconnectCall() {
  const popup = document.getElementById("videoPopup");
  popup.classList.add("hidden");

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  if (remoteVideo && remoteVideo.srcObject) {
    remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
    remoteVideo.srcObject = null;
  }

  if (localVideo) {
    localVideo.srcObject = null;
  }

  // ✅ Show call button again
  startCallBtn.style.display = "inline-block";
}

startCallBtn.onclick = async () => {
  const popup = document.getElementById("videoPopup");
  const toSocketId = popup.dataset.socketId;
  if (!toSocketId) return alert("Invalid recipient");

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideo.srcObject = localStream;

    // ✅ Hide call button during call
    startCallBtn.style.display = "none";

    createPeerConnection(toSocketId);

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("offer", { offer, to: toSocketId });
  } catch (err) {
    console.error("Error starting call:", err);
    alert("Could not access camera/mic.");
  }
};

const closeBtn = document.getElementById("closePopupBtn");
closeBtn.onclick = () => {
  const popup = document.getElementById("videoPopup");
  const toSocketId = popup.dataset.socketId;

  // Only emit hang-up if a call is in progress
  if (toSocketId && peerConnection) {
    socket.emit("hang-up", { to: toSocketId });
  }

  disconnectCall(); // Always clean up locally
};

hangUpBtn.onclick = () => {
  const popup = document.getElementById("videoPopup");
  const toSocketId = popup.dataset.socketId;
  socket.emit("hang-up", { to: toSocketId });

  disconnectCall();
};

socket.on("offer", async ({ offer, from }) => {
  try {
    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideo.srcObject = localStream;
    }

    const popup = document.getElementById("videoPopup");
    popup.classList.remove("hidden");
    popup.dataset.socketId = from;

    // ✅ Hide call button during incoming call
    startCallBtn.style.display = "none";

    createPeerConnection(from);

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("answer", { answer, to: from });
  } catch (err) {
    console.error("Error handling offer:", err);
  }
});

socket.on("answer", async ({ answer }) => {
  if (!peerConnection) return;
  await peerConnection.setRemoteDescription(answer);
});

socket.on("ice-candidate", ({ candidate }) => {
  if (candidate && peerConnection) {
    peerConnection.addIceCandidate(candidate);
  }
});

socket.on("hang-up", () => {
  disconnectCall();
  setTimeout(() => {
    alert("📴 Remote user disconnected the call.");
  }, 800);
});

socket.on("call-declined", ({ from }) => {
  alert("Call declined by the remote user!");
  disconnectCall(); // ✅ Optional: ensures full cleanup
});

socket.on("disconnect", () => {
  disconnectCall();
});
