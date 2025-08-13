const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("node:http");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config(); // load variables into process.env
const userRoutes = require("./routes/userRouter");

const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

const main = async()=>{
  await mongoose.connect(process.env.MONGO_URL);
}
main()
.then(()=>{
  console.log("Database connected successfully");
}).catch((err)=>{
  console.log(err);
})

app.use(bodyParser.json());
const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("join-room", (data) => {
    const { roomId, emailId } = data;
    
    const room = io.sockets.adapter.rooms.get(roomId);
    const numClients = room ? room.size : 0;
    
    console.log(`User ${emailId} trying to join room ${roomId}. Current size: ${numClients}`);

    if (numClients >= 2) {
      console.log(`Room ${roomId} is full. Rejecting user ${emailId}.`);
      socket.emit("room-full", { message: "Room is full. Try another room." });
      return;
    }
    
    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    socket.join(roomId);
    console.log("User", emailId, "joined room", roomId);

    socket.emit("joined-room", { roomId: roomId });
    socket.broadcast.to(roomId).emit("user-joined", { emailId });
  });

  socket.on("user-call", (data) => {
    const { emailId, offer } = data;
    const socketId = emailToSocketMapping.get(emailId);
    const fromEmail = socketToEmailMapping.get(socket.id);
    socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
  });

  socket.on("call-accepted", (data) => {
    const { emailId, ans } = data;
    const socketId = emailToSocketMapping.get(emailId);
    socket.to(socketId).emit("call-accepted", { ans });
  });

  socket.on("ice-candidate", (data) => {
    const { to, candidate } = data;
    const toSocketId = emailToSocketMapping.get(to);
    const fromEmail = socketToEmailMapping.get(socket.id);
    if (toSocketId) {
      socket.to(toSocketId).emit("ice-candidate", {
        candidate: candidate,
        from: fromEmail,
      });
    }
  });

  // BUG FIX: This handler is now responsible for full call teardown.
  socket.on("disconnect-room", (data) => {
    const { roomId, emailId: remoteUserEmail } = data;
    const initiatorEmail = socketToEmailMapping.get(socket.id);
    
    console.log(`Teardown initiated by ${initiatorEmail} for room ${roomId}`);
    
    // 1. Notify the other user (if they exist)
    const remoteUserSocketId = emailToSocketMapping.get(remoteUserEmail);
    if (remoteUserSocketId) {
      console.log(`Notifying ${remoteUserEmail} that the call has ended.`);
      io.to(remoteUserSocketId).emit("user-disconnected",{partnerEmail:initiatorEmail});
    }

    // 2. Make all sockets in the room leave the room.
    // This is the key fix for the "Room is full" bug.
    if (roomId) {
        console.log(`Emptying room: ${roomId}`);
        io.in(roomId).socketsLeave(roomId);
    }

    // 3. Clean up mappings for both users
    if (initiatorEmail) {
        emailToSocketMapping.delete(initiatorEmail);
        socketToEmailMapping.delete(socket.id);
        console.log(`Cleaned up mappings for initiator: ${initiatorEmail}`);
    }
    if (remoteUserEmail) {
        emailToSocketMapping.delete(remoteUserEmail);
        if (remoteUserSocketId) {
            socketToEmailMapping.delete(remoteUserSocketId);
        }
        console.log(`Cleaned up mappings for remote user: ${remoteUserEmail}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Native disconnect event for socket:", socket.id);
    // This now serves as a fallback for abrupt disconnections (e.g., closing browser tab)
    const emailId = socketToEmailMapping.get(socket.id);
    if (emailId) {
      console.log(`Cleaning up mappings for abruptly disconnected user: ${emailId}`);
      emailToSocketMapping.delete(emailId);
      socketToEmailMapping.delete(socket.id);
      // We could also try to notify the other user here if we knew the room,
      // but the graceful disconnect handler is more robust.
    }
  });
});

app.use("/api/v1/users", userRoutes);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});