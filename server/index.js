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
    console.log("User", emailId, "joined room", roomId);

    const room = io.sockets.adapter.rooms.get(roomId);
    const numClients = room ? room.size : 0;

    if (numClients >= 2) {
    socket.emit("room-full", { message: "Room is full. Try another room." });
    return;
    }
    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    socket.join(roomId);

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

  socket.on("disconnect", () => {
    const emailId = socketToEmailMapping.get(socket.id);
    if (emailId) {
      emailToSocketMapping.delete(emailId);
      socketToEmailMapping.delete(socket.id);
    }
  });
});
app.use("/api/v1/users", userRoutes);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
