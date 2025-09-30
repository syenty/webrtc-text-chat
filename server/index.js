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

  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    if (users[roomName]) {
      const usersInThisRoom = users[roomName].filter((id) => id !== socket.id);
      socket.emit("all_users", usersInThisRoom);
    } else {
      users[roomName] = [];
    }
    users[roomName].push(socket.id);
    console.log(`User ${socket.id} joined room: ${roomName}. Users in room:`, users[roomName]);
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
    for (const roomName in users) {
      const room = users[roomName];
      if (room.includes(socket.id)) {
        users[roomName] = room.filter((id) => id !== socket.id);
        socket.to(roomName).emit("user_left", socket.id);
        if (users[roomName].length === 0) {
          delete users[roomName];
        }
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
