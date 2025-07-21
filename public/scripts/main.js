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
  console.log(
    "🧱 [createPeerConnection] Creating RTCPeerConnection for",
    toSocketId
  );

  peerConnection = new RTCPeerConnection(config);
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;

  remoteVideo.onloadedmetadata = () => {
    console.log("🎞️ [remoteVideo] Metadata loaded. Attempting playback.");
    remoteVideo
      .play()
      .then(() => {
        console.log("▶️ [remoteVideo] Playback started successfully");
      })
      .catch((err) => {
        console.warn("⚠️ [remoteVideo] Autoplay failed:", err);
      });
  };

  peerConnection.ontrack = (event) => {
    console.log(`✅ [ontrack] Track received: ${event.track.kind}`);
    event.track.onunmute = () => {
      if (!remoteStream.getTracks().some((t) => t.id === event.track.id)) {
        console.log(
          `🎥 [ontrack] Adding unique track to remoteStream: ${event.track.kind}`
        );
        remoteStream.addTrack(event.track);
      } else {
        console.log(
          `🚫 [ontrack] Duplicate track ignored: ${event.track.kind}`
        );
      }
    };
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
    console.log("🔌 [onconnectionstatechange] State:", state);
    if (["disconnected", "failed", "closed"].includes(state)) {
      console.warn("⚠️ [PeerConnection] Abnormal state:", state);
      disconnectCall();
    }
  };
}

function disconnectCall() {
  console.log("📞 [disconnectCall] Cleaning up all resources");

  const popup = document.getElementById("videoPopup");
  popup.classList.add("hidden");

  if (callRetryTimeout) {
    console.log("🛑 [disconnectCall] Clearing retry timeout");
    clearTimeout(callRetryTimeout);
    callRetryTimeout = null;
  }

  if (peerConnection) {
    console.log("🧹 [disconnectCall] Closing peer connection");
    peerConnection.close();
    peerConnection = null;
  }

  remoteDescSet = false;
  pendingCandidates = [];
  retryAttempted = false;

  if (localStream) {
    console.log("🛑 [disconnectCall] Stopping local tracks");
    localStream.getTracks().forEach((track) => {
      console.log("🔇 [disconnectCall] Stopping track:", track.kind);
      track.stop();
    });
    localStream = null;
  }

  if (remoteVideo && remoteVideo.srcObject) {
    console.log("🛑 [disconnectCall] Stopping remote tracks");
    remoteVideo.srcObject.getTracks().forEach((track) => {
      console.log("🔇 [disconnectCall] Stopping remote track:", track.kind);
      track.stop();
    });
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
    console.log("🎙️ [startCall] Requesting local media...");
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    console.log("🎥 [startCall] Local media acquired.");
    localVideo.srcObject = localStream;

    startCallBtn.style.display = "none";

    createPeerConnection(toSocketId);

    localStream.getTracks().forEach((track) => {
      console.log("📥 [startCall] Adding local track:", track.kind);
      peerConnection.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer();
    console.log("📨 [startCall] Created offer, setting local description...");
    await peerConnection.setLocalDescription(offer);

    console.log("📡 [startCall] Sending offer to", toSocketId);
    socket.emit("offer", { offer, to: toSocketId });

    callRetryTimeout = setTimeout(() => {
      if (!remoteStream || remoteStream.getTracks().length === 0) {
        console.warn("🕒 [startCall] No remote track in 5s. Retrying...");
        if (!retryAttempted) {
          retryAttempted = true;
          disconnectCall();
          startCallBtn.click();
        }
      }
    }, 5000);
  } catch (err) {
    console.error("❌ [startCall] Failed to get media:", err);
    alert("Could not access camera/mic.");
  }
};

const closeBtn = document.getElementById("closePopupBtn");
closeBtn.onclick = () => {
  const popup = document.getElementById("videoPopup");
  const toSocketId = popup.dataset.socketId;

  if (toSocketId && peerConnection) {
    console.log("📴 [closePopup] Sending hang-up to", toSocketId);
    socket.emit("hang-up", { to: toSocketId });
  }

  disconnectCall();
};

hangUpBtn.onclick = () => {
  const popup = document.getElementById("videoPopup");
  const toSocketId = popup.dataset.socketId;
  console.log("🧼 [hangUpBtn] User clicked hang-up");
  socket.emit("hang-up", { to: toSocketId });

  disconnectCall();
};

socket.on("offer", async ({ offer, from }) => {
  try {
    console.log("📞 [offer] Incoming offer from", from);

    if (!localStream) {
      console.log("🎙️ [offer] Getting local media...");
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("🎥 [offer] Local media acquired.");
      localVideo.srcObject = localStream;
    }

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
    remoteDescSet = true;

    pendingCandidates.forEach((candidate) => {
      console.log("📬 [offer] Adding buffered ICE candidate");
      peerConnection.addIceCandidate(candidate).catch((err) => {
        console.error("❌ [offer] Error adding buffered ICE:", err);
      });
    });
    pendingCandidates = [];

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log("📨 [offer] Sending answer to", from);

    socket.emit("answer", { answer, to: from });
  } catch (err) {
    console.error("❌ [offer] Error handling offer:", err);
  }
});

socket.on("answer", async ({ answer }) => {
  if (!peerConnection) return;
  console.log("📥 [answer] Received answer");
  await peerConnection.setRemoteDescription(answer);
  remoteDescSet = true;

  pendingCandidates.forEach((candidate) => {
    console.log("📬 [answer] Adding buffered ICE candidate");
    peerConnection.addIceCandidate(candidate).catch((err) => {
      console.error("❌ [answer] Error adding buffered ICE:", err);
    });
  });
  pendingCandidates = [];
});

socket.on("ice-candidate", ({ candidate }) => {
  if (!peerConnection || !candidate) return;

  if (remoteDescSet) {
    console.log("📥 [ice-candidate] Adding ICE candidate");
    peerConnection.addIceCandidate(candidate).catch((err) => {
      console.error("❌ [ice-candidate] Error adding candidate:", err);
    });
  } else {
    console.log("📥 [ice-candidate] Remote desc not set. Buffering ICE");
    pendingCandidates.push(candidate);
  }
});

socket.on("hang-up", () => {
  console.log("📴 [socket] Hang-up received");
  disconnectCall();
  setTimeout(() => {
    alert("📴 Remote user disconnected the call.");
  }, 800);
});

socket.on("call-declined", ({ from }) => {
  console.log("🚫 [socket] Call declined by", from);
  alert("Call declined by the remote user!");
  disconnectCall();
});

socket.on("disconnect", () => {
  console.log("⚡ [socket] Socket disconnected");
  disconnectCall();
});
