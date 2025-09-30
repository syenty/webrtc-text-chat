<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { io } from "socket.io-client";
import Peer from "simple-peer"; // simple-peer 라이브러리 사용

const props = defineProps({
  roomName: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["leave"]);

const chatMessages = ref([]);
const chatInput = ref("");

let socket = null;
const peers = ref({}); // key: socketId, value: Peer instance
const peerNicknames = ref({}); // key: socketId, value: nickname

const STUN_SERVER = "stun:stun.l.google.com:19302";

onMounted(async () => {
  console.log(`Entering room: ${props.roomName}`);

  socket = io("http://localhost:3000");

  socket.on("connect", () => {
    console.log("Connected to signaling server with id:", socket.id);
    socket.emit("join_room", { roomName: props.roomName, nickname: props.nickname });
  });

  // 닉네임 중복으로 입장 실패 시
  socket.on("join_failed", (reason) => {
    alert(reason);
    emit("leave"); // App.vue로 이벤트 보내서 로비로 돌아가게 함
  });

  // 방에 이미 있던 다른 유저들의 정보를 받음
  socket.on("all_users", (users) => {
    console.log("All users in room:", users);
    chatMessages.value.push({ type: "system", text: `You joined the room "${props.roomName}".` });
    users.forEach((user) => {
      const peer = createPeer(user.id, socket.id);
      peers.value[user.id] = peer;
      peerNicknames.value[user.id] = user.nickname;
    });
  });

  // 새로운 유저가 방에 들어왔을 때의 이벤트 처리
  socket.on("user_joined_info", (user) => {
    console.log(`User ${user.nickname}(${user.id}) joined the room.`);
    chatMessages.value.push({ type: "system", text: `User "${user.nickname}" has joined.` });
  });

  // 다른 유저가 보낸 시그널을 받았을 때 (연결 요청)
  socket.on("user_joined", (payload) => {
    console.log(`Receiving signal from ${payload.callerID}`);
    const peer = addPeer(payload.signal, payload.callerID);
    peers.value[payload.callerID] = peer;
  });

  // 내가 보낸 시그널에 대한 응답을 받았을 때
  socket.on("receiving_returned_signal", (payload) => {
    const item = peers.value[payload.id];
    item.signal(payload.signal);
  });

  socket.on("user_left", (user) => {
    console.log(`User ${user.nickname}(${user.id}) left the room.`);
    chatMessages.value.push({ type: "system", text: `User "${user.nickname}" has left.` });
    if (peers.value[user.id]) {
      peers.value[user.id].destroy();
    }
    delete peers.value[user.id];
    delete peerNicknames.value[user.id];
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

function setupPeerEvents(peer, peerId) {
  peer.on("connect", () => {
    // 연결이 성립되면 상대방의 닉네임을 요청하거나, 서버를 통해 받을 수 있습니다.
    // 현재는 user_joined_info 와 all_users 에서 미리 받아옵니다.
  });
  peer.on("data", (data) => {
    const message = JSON.parse(data);
    chatMessages.value.push({ sender: message.nickname, text: message.text });
  });
  peer.on("close", () => {
    console.log(`Peer connection with ${peerId} closed.`);
  });
  peer.on("error", (err) => {
    console.error(`Error with peer ${peerId}:`, err);
  });
}

function leaveRoom() {
  window.location.reload(); // 간단하게 새로고침으로 퇴장 처리
}

function sendChatMessage() {
  if (chatInput.value.trim() === "") return;

  const message = {
    text: chatInput.value,
    nickname: props.nickname,
  };

  // 모든 peer에게 메시지 전송
  Object.values(peers.value).forEach((peer) => {
    if (peer.connected) {
      peer.send(JSON.stringify(message));
    }
  });

  chatMessages.value.push({ sender: props.nickname, text: chatInput.value });
  chatInput.value = "";
}
</script>

<template>
  <div class="chat-room">
    <div class="chat-container">
      <h3>Room: {{ roomName }}</h3>
      <div class="chat-messages">
        <template v-for="(msg, index) in chatMessages" :key="index">
          <div v-if="msg.type === 'system'" class="system-message">
            {{ msg.text }}
          </div>
          <div
            v-else
            :class="['message', msg.sender === props.nickname ? 'my-message' : 'peer-message']"
          >
            <strong v-if="msg.sender !== props.nickname" class="sender-name"
              >{{ msg.sender }}:</strong
            >
            <span class="message-text">{{ msg.text }}</span>
          </div>
        </template>
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
.system-message {
  text-align: center;
  color: #888;
  font-style: italic;
  font-size: 0.9em;
}
.message {
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 80%;
  color: black;
}
.sender-name {
  display: block;
  font-size: 0.8em;
  margin-bottom: 4px;
  color: #555;
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
