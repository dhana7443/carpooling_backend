require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Ride = require("./modules/rides/ride.model");
const Booking = require("./modules/rideRequests/rideRequest.model");
const ChatService=require("./modules/chat/chat.service");

const PORT = process.env.PORT || 3000;

// Create http server from express app
const server = http.createServer(app);

// Setup socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // TODO: restrict to your frontend URL later
    methods: ["GET", "POST"],
  },
});

app.set("io",io);

//  Socket JWT authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Unauthorized: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // attach user info to socket
    next();
  } catch (err) {
    return next(new Error("Authorization error: " + err.message));
  }
});

//  Socket.io events
io.on("connection", (socket) => {
  console.log(" New client connected:", socket.id, "User:", socket.user);

  // Send a welcome message to client immediately
  // socket.emit("receiveMessage", {
  //   sender: "system",
  //   role: "system",
  //   message: "Welcome to the chat!",
  //   timestamp: new Date(),
  // });

  //  Join ride room
  socket.on("joinRoom", async (rideId) => {
    try {
      const userId = socket.user.user_id;
      const role = socket.user.role_name;

      console.log(` User ${userId} (${role}) attempting to join room ${rideId}`);

      // Check if ride exists
      const ride = await Ride.findById(rideId);
      if (!ride) {
        console.log(" Ride not found:", rideId);
        return socket.emit("chatError", { message: "Ride not found" });
      }

      // If user is the driver of the ride
      if (ride.driver_id.toString() === userId) {
        socket.join(rideId);
        console.log(` Driver ${userId} joined ride room ${rideId}. Rooms:`, socket.rooms);
        return;
      }

      // If user is an accepted rider
      const booking = await Booking.findOne({
        ride_id: rideId,
        rider_id: userId,
        status: "Accepted",
      });

      if (booking) {
        socket.join(rideId);
        console.log(` Rider ${userId} joined ride room ${rideId}. Rooms:`, socket.rooms);
      } else {
        console.log(` Rider ${userId} not allowed to join ride room ${rideId}`);
        socket.emit("chatError", { message: "You are not allowed to join this ride chat" });
      }
    } catch (err) {
      console.error(" Error in joinRoom:", err);
      socket.emit("chatError", { message: "Unable to join room" });
    }
  });

  //  Handle sending message
  socket.on("sendMessage", async ({ rideId, message ,localId}) => {
    try {
      const userId = socket.user.user_id;

      console.log(` Message received from ${userId} for ride ${rideId}:`, message);

      // Check if user is in the room
      const rooms = Array.from(socket.rooms);
      if (!rooms.includes(rideId)) {
        console.log(` User ${userId} tried to send message without joining room ${rideId}`);
        return socket.emit("chatError", { message: "You are not part of this ride chat" });
      }


      // inside socket.on("sendMessage")
      const saved = await ChatService.saveMessage({
        rideId,
        senderId: userId,
        senderRole: socket.user.role_name,
        message
      });

      const msg = {
        _id: saved._id,
        ride_id: saved.ride_id,
        sender: saved.sender_id.toString(),
        role: saved.sender_role,
        message: saved.message,
        timestamp: saved.createdAt,
        localId
      };

      
      console.log(" Emitting message to room", rideId, ":", msg);

      io.to(rideId).emit("receiveMessage", msg);
    } catch (err) {
      console.error(" Error in sendMessage:", err);
      socket.emit("chatError", { message: "Unable to send message" });
    }
  });

  //  Handle leaving room
  socket.on("leaveRoom", (rideId) => {
    socket.leave(rideId);
    console.log(` User ${socket.user.user_id} left ride room ${rideId}`);
  });

  //  Disconnect
  socket.on("disconnect", () => {
    console.log(" Client disconnected:", socket.id, "User:", socket.user?.user_id);
  });
});

//enable cors 
app.use(cors());

// Connect DB
connectDB();


// IMPORTANT: use `server.listen` not `app.listen`
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
