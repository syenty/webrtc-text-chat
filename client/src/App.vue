<script setup>
import { ref } from "vue";
import ChatRoom from "./components/ChatRoom.vue";

const roomName = ref("");
const entered = ref(false);

function joinRoom() {
  if (roomName.value.trim() !== "") {
    entered.value = true;
  } else {
    alert("Please enter a room name.");
  }
}
</script>

<template>
  <main>
    <div v-if="!entered" class="lobby">
      <h1>WebRTC Chat</h1>
      <input v-model="roomName" type="text" placeholder="Enter Room Name" @keyup.enter="joinRoom" />
      <button @click="joinRoom">Join Room</button>
    </div>
    <div v-else>
      <ChatRoom :room-name="roomName" />
    </div>
  </main>
</template>

<style scoped>
.lobby {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 5rem;
}
</style>
