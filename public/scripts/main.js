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

let remoteDescSet = false;
let pendingCandidates = [];
let callRetryTimeout = null;
let retryAttempted = false;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function createPeerConnection(toSocketId) {
  console.log("🧱 Creating peer connection to", toSocketId);
  peerConnection = new RTCPeerConnection(config);
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;

  peerConnection.ontrack = (event) => {
    console.log("✅ Remote track received:", event.track.kind);
    event.streams[0].getTracks().forEach((track) => {
      console.log("🎥 Adding track to remoteStream:", track.kind);
      remoteStream.addTrack(track);
    });

    if (callRetryTimeout) {
      console.log("🛑 Cancelling retry timer (track received)");
      clearTimeout(callRetryTimeout);
      callRetryTimeout = null;
    }
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("❄️ Sending ICE candidate");
      socket.emit("ice-candidate", {
        candidate: event.candidate,
        to: toSocketId,
      });
    }
  };

  peerConnection.onconnectionstatechange = () => {
    const state = peerConnection.connectionState;
    console.log("🔌 Connection state changed:", state);
    if (["disconnected", "failed", "closed"].includes(state)) {
      console.warn("⚠️ Peer connection state:", state);
      disconnectCall();
    }
  };
}

function disconnectCall() {
  console.log("📞 Disconnecting call");

  const popup = document.getElementById("videoPopup");
  popup.classList.add("hidden");

  if (callRetryTimeout) {
    console.log("🛑 Clearing retry timeout");
    clearTimeout(callRetryTimeout);
    callRetryTimeout = null;
  }

  if (peerConnection) {
    console.log("🧹 Closing peer connection");
    peerConnection.close();
    peerConnection = null;
  }

  remoteDescSet = false;
  pendingCandidates = [];
  retryAttempted = false;

  if (localStream) {
    console.log("🛑 Stopping local stream tracks");
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  if (remoteVideo && remoteVideo.srcObject) {
    console.log("🛑 Stopping remote stream tracks");
    remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
    remoteVideo.srcObject = null;
  }

  if (localVideo) {
    localVideo.srcObject = null;
  }

  startCallBtn.style.display = "inline-block";
}

startCallBtn.onclick = async () => {
  const popup = document.getElementById("videoPopup");
  const toSocketId = popup.dataset.socketId;
  if (!toSocketId) return alert("Invalid recipient");

  try {
    console.log("🎙️ Accessing local media");
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideo.srcObject = localStream;

    startCallBtn.style.display = "none";

    createPeerConnection(toSocketId);

    console.log("📥 Adding local tracks to connection");
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer();
    console.log("📨 Sending offer to", toSocketId);
    await peerConnection.setLocalDescription(offer);

    socket.emit("offer", { offer, to: toSocketId });

    console.log("⏳ Starting 5s retry timer");
    callRetryTimeout = setTimeout(() => {
      if (!remoteStream || remoteStream.getTracks().length === 0) {
        console.warn("🕒 No remote track in 5s. Retrying...");
        if (!retryAttempted) {
          retryAttempted = true;
          disconnectCall();
          startCallBtn.click(); // Retry call
        }
      }
    }, 5000);
  } catch (err) {
    console.error("❌ Error starting call:", err);
    alert("Could not access camera/mic.");
  }
};

const closeBtn = document.getElementById("closePopupBtn");
closeBtn.onclick = () => {
  const popup = document.getElementById("videoPopup");
  const toSocketId = popup.dataset.socketId;

  if (toSocketId && peerConnection) {
    console.log("📴 Sending hang-up to", toSocketId);
    socket.emit("hang-up", { to: toSocketId });
  }

  disconnectCall();
};

hangUpBtn.onclick = () => {
  const popup = document.getElementById("videoPopup");
  const toSocketId = popup.dataset.socketId;
  console.log("🧼 User clicked hang-up");
  socket.emit("hang-up", { to: toSocketId });

  disconnectCall();
};

socket.on("offer", async ({ offer, from }) => {
  try {
    console.log("📞 Incoming offer from", from);
    if (!localStream) {
      console.log("🎙️ Accessing local media for incoming call");
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideo.srcObject = localStream;
    }

    const popup = document.getElementById("videoPopup");
    popup.classList.remove("hidden");
    popup.dataset.socketId = from;

    startCallBtn.style.display = "none";

    createPeerConnection(from);

    console.log("📥 Adding local tracks for answering call");
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    await peerConnection.setRemoteDescription(offer);
    console.log("📩 Set remote description from offer");
    remoteDescSet = true;

    pendingCandidates.forEach((candidate) => {
      console.log("📬 Adding buffered ICE candidate");
      peerConnection.addIceCandidate(candidate).catch((err) => {
        console.error("❌ Error adding buffered ICE:", err);
      });
    });
    pendingCandidates = [];

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log("📨 Sending answer to", from);

    socket.emit("answer", { answer, to: from });
  } catch (err) {
    console.error("❌ Error handling offer:", err);
  }
});

socket.on("answer", async ({ answer }) => {
  if (!peerConnection) return;
  console.log("📥 Answer received from remote");
  await peerConnection.setRemoteDescription(answer);
  remoteDescSet = true;

  pendingCandidates.forEach((candidate) => {
    console.log("📬 Adding buffered ICE candidate after answer");
    peerConnection.addIceCandidate(candidate).catch((err) => {
      console.error("❌ Error adding buffered ICE:", err);
    });
  });
  pendingCandidates = [];
});

socket.on("ice-candidate", ({ candidate }) => {
  if (!peerConnection || !candidate) return;

  if (remoteDescSet) {
    console.log("📥 ICE candidate received and added");
    peerConnection.addIceCandidate(candidate).catch((err) => {
      console.error("❌ Error adding ICE candidate:", err);
    });
  } else {
    console.log("📥 ICE received before remote description, buffering");
    pendingCandidates.push(candidate);
  }
});

socket.on("hang-up", () => {
  console.log("📴 Hang-up received from remote");
  disconnectCall();
  setTimeout(() => {
    alert("📴 Remote user disconnected the call.");
  }, 800);
});

socket.on("call-declined", ({ from }) => {
  console.log("🚫 Call declined by", from);
  alert("Call declined by the remote user!");
  disconnectCall();
});

socket.on("disconnect", () => {
  console.log("⚡ Socket disconnected");
  disconnectCall();
});
