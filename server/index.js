import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// CORS 처리를 위한 옵션 설정
// 개발 환경에서는 클라이언트(8080)와 서버(3000)의 포트가 다르므로 CORS 에러가 발생할 수 있습니다.
const io = new Server(server, {
  cors: {
    origin: "*", // 실제 프로덕션 환경에서는 '*' 대신 특정 도메인을 명시해야 합니다.
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

// 간단한 서버 동작 확인용 라우트
app.get("/", (req, res) => {
  res.send("WebRTC Signaling Server is running!");
});

// Socket.IO 시그널링 로직
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // 채팅방 참여 이벤트
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    console.log(`User ${socket.id} joined room: ${roomName}`);
    // 방에 있는 다른 클라이언트에게 새로운 유저의 참여를 알림
    socket.to(roomName).emit("user_joined", socket.id);
  });

  // WebRTC Offer 메시지 중계
  socket.on("offer", (offer, roomName, senderId) => {
    // Offer를 보낸 클라이언트를 제외한 다른 모든 클라이언트에게 Offer 전달
    socket.to(roomName).emit("offer", offer, senderId);
    console.log(`Offer from ${senderId} relayed to room: ${roomName}`);
  });

  // WebRTC Answer 메시지 중계
  socket.on("answer", (answer, roomName, senderId) => {
    socket.to(roomName).emit("answer", answer, senderId);
    console.log(`Answer from ${senderId} relayed to room: ${roomName}`);
  });

  // WebRTC ICE Candidate 메시지 중계
  socket.on("ice_candidate", (candidate, roomName, senderId) => {
    socket.to(roomName).emit("ice_candidate", candidate, senderId);
    console.log(`ICE Candidate from ${senderId} relayed to room: ${roomName}`);
  });

  // 연결 종료 처리
  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
    // 필요하다면, 해당 유저가 속했던 모든 방에 퇴장했음을 알리는 로직을 추가할 수 있습니다.
    // io.emit('user_left', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
