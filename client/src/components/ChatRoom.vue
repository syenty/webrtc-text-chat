<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { io } from "socket.io-client";
import Peer from "simple-peer"; // simple-peer 라이브러리 사용

const props = defineProps({
  roomName: {
    type: String,
    required: true,
  },
});

const chatMessages = ref([]);
const chatInput = ref("");

let socket = null;
const peers = ref({}); // key: socketId, value: Peer instance

const STUN_SERVER = "stun:stun.l.google.com:19302";

onMounted(async () => {
  console.log(`Entering room: ${props.roomName}`);

  socket = io("http://localhost:3000");

  socket.on("connect", () => {
    console.log("Connected to signaling server with id:", socket.id);
    socket.emit("join_room", props.roomName);
  });

  // 방에 이미 있던 다른 유저들의 정보를 받음
  socket.on("all_users", (users) => {
    console.log("All users in room:", users);
    users.forEach((userId) => {
      const peer = createPeer(userId, socket.id);
      peers.value[userId] = peer;
    });
  });

  // 새로운 유저가 방에 들어왔을 때의 이벤트 처리
  socket.on("user_joined", (payload) => {
    console.log(`User ${payload.callerID} joined the room.`);
    const peer = addPeer(payload.signal, payload.callerID);
    peers.value[payload.callerID] = peer;
  });

  socket.on("receiving_returned_signal", (payload) => {
    const item = peers.value[payload.id];
    item.signal(payload.signal);
  });

  socket.on("user_left", (id) => {
    console.log(`User ${id} left the room.`);
    if (peers.value[id]) {
      peers.value[id].destroy();
    }
    delete peers.value[id];
  });
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
  Object.values(peers.value).forEach((peer) => peer.destroy());
});

function createPeer(userToSignal, callerID) {
  const peer = new Peer({
    initiator: true,
    trickle: false,
    config: { iceServers: [{ urls: STUN_SERVER }] },
  });

  peer.on("signal", (signal) => {
    socket.emit("sending_signal", { userToSignal, callerID, signal });
  });

  setupPeerEvents(peer, userToSignal);
  return peer;
}

function addPeer(incomingSignal, callerID) {
  const peer = new Peer({
    initiator: false,
    trickle: false,
    config: { iceServers: [{ urls: STUN_SERVER }] },
  });

  peer.on("signal", (signal) => {
    socket.emit("returning_signal", { signal, callerID });
  });

  peer.signal(incomingSignal);
  setupPeerEvents(peer, callerID);
  return peer;
}

function setupPeerEvents(peer, userId) {
  peer.on("data", (data) => {
    const message = JSON.parse(data);
    chatMessages.value.push({ sender: userId.substring(0, 6), text: message.text });
  });
  peer.on("close", () => {
    console.log(`Peer connection with ${userId} closed.`);
  });
  peer.on("error", (err) => {
    console.error(`Error with peer ${userId}:`, err);
  });
}

function leaveRoom() {
  window.location.reload(); // 간단하게 새로고침으로 퇴장 처리
}

function sendChatMessage() {
  if (chatInput.value.trim() === "") return;

  const message = {
    text: chatInput.value,
  };

  // 모든 peer에게 메시지 전송
  Object.values(peers.value).forEach((peer) => {
    if (peer.connected) {
      peer.send(JSON.stringify(message));
    }
  });

  chatMessages.value.push({ sender: "Me", text: chatInput.value });
  chatInput.value = "";
}
</script>

<template>
  <div class="chat-room">
    <div class="chat-container">
      <h3>Room: {{ roomName }}</h3>
      <div class="chat-messages">
        <div
          v-for="(msg, index) in chatMessages"
          :key="index"
          :class="['message', msg.sender === 'Me' ? 'my-message' : 'peer-message']"
        >
          <strong>{{ msg.sender }}:</strong> {{ msg.text }}
        </div>
      </div>
      <form @submit.prevent="sendChatMessage" class="chat-input-form">
        <input v-model="chatInput" type="text" placeholder="Type a message..." />
        <button type="submit">Send</button>
      </form>
    </div>
    <div class="controls">
      <button @click="leaveRoom">Leave Room</button>
    </div>
  </div>
</template>

<style scoped>
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}
.chat-container {
  border: 1px solid #ccc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: #f9f9f9;
  flex-grow: 1;
  margin-top: 2rem;
  overflow: hidden;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.message {
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 80%;
}
.my-message {
  background-color: #dcf8c6;
  align-self: flex-end;
}
.peer-message {
  background-color: #fff;
  align-self: flex-start;
  border: 1px solid #eee;
}
.chat-input-form {
  display: flex;
}
.chat-input-form input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
}
.chat-input-form button {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-left: none;
  background-color: #eee;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}
.controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}
</style>
