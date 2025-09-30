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

const users = {};

// Socket.IO 시그널링 로직
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  // 소켓에 연결된 방 이름을 저장하기 위한 변수
  let currentRoom = null;

  socket.on("join_room", ({ roomName, nickname }) => {
    // 닉네임 중복 체크
    if (users[roomName] && users[roomName].some((user) => user.nickname === nickname)) {
      socket.emit("join_failed", "This nickname is already taken in the room.");
      return;
    }

    socket.join(roomName);
    currentRoom = roomName; // 현재 방 이름 저장

    if (users[roomName]) {
      const usersInThisRoom = users[roomName];
      socket.emit("all_users", usersInThisRoom);
    } else {
      users[roomName] = [];
    }
    users[roomName].push({ id: socket.id, nickname });
    console.log(`User ${nickname}(${socket.id}) joined room: ${roomName}.`);

    socket.to(roomName).emit("user_joined_info", { id: socket.id, nickname });
  });

  socket.on("sending_signal", (payload) => {
    io.to(payload.userToSignal).emit("user_joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });

  socket.on("returning_signal", (payload) => {
    io.to(payload.callerID).emit("receiving_returned_signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
    if (currentRoom && users[currentRoom]) {
      const userWhoLeft = users[currentRoom].find((user) => user.id === socket.id);
      // 해당 유저를 방에서 제거
      users[currentRoom] = users[currentRoom].filter((user) => user.id !== socket.id);
      // 다른 사람들에게 퇴장 알림
      if (userWhoLeft) {
        socket.to(currentRoom).emit("user_left", userWhoLeft);
      }
      // 방이 비었으면 방 정보 삭제
      if (users[currentRoom].length === 0) {
        delete users[currentRoom];
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
