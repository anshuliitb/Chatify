import { registerUIEmitters } from "./socketEvents/registerUIEmitters.js";
import { registerSocketListeners } from "./socketEvents/registerSocketListeners.js";

export const socket = io();

document.addEventListener("DOMContentLoaded", () => {
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

  // Create new RTCPeerConnection and attach event listeners
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
      if (
        peerConnection.connectionState === "disconnected" ||
        peerConnection.connectionState === "failed"
      ) {
        disconnectCall(); // auto disconnect on failure
      }
    };
  }

  // Stop all media and clean connection
  function disconnectCall() {
    // ✅ Close the peer connection
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    // ✅ Stop local video stream (turn off webcam and mic)
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop(); // ❌ Very important – turns off webcam/mic
      });
      localStream = null;
    }

    // ✅ Clear video elements
    if (localVideo) {
      localVideo.srcObject = null;
    }

    if (remoteVideo && remoteVideo.srcObject) {
      remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
      remoteVideo.srcObject = null;
    }

    const videoPopup = document.getElementById("videoPopup");
    videoPopup.classList.add("hidden");
  }

  // Start Call Button Click
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

  // Disconnect Button Click
  hangUpBtn.onclick = () => {
    const popup = document.getElementById("videoPopup");
    const toSocketId = popup.dataset.socketId;
    socket.emit("hang-up", { to: toSocketId });

    disconnectCall();
  };

  // Received offer from remote
  socket.on("offer", async ({ offer, from }) => {
    try {
      if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localVideo.srcObject = localStream;
      }

      const videoPopup = document.getElementById("videoPopup");
      videoPopup.classList.remove("hidden");

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

  socket.on("call-declined", ({ from }) => {
    alert("Call declined by the remote user!");
  });

  // Received answer
  socket.on("answer", async ({ answer }) => {
    if (!peerConnection) return;
    await peerConnection.setRemoteDescription(answer);
  });

  // Received ICE candidate
  socket.on("ice-candidate", ({ candidate }) => {
    if (candidate && peerConnection) {
      peerConnection.addIceCandidate(candidate);
    }
  });

  // Remote user hung up
  socket.on("hang-up", () => {
    disconnectCall();
    alert("📴 Remote user disconnected the call.");
  });
});
