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
const Conversation=require("./modules/conversations/conversation.model");
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

  
  //  Join ride room
  socket.on("joinConversation", async ({ rideId, otherUserId }) => {
  try {
    const userId = socket.user.user_id;
    const role = socket.user.role_name;

    // ensure ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return socket.emit("chatError", { message: "Ride not found" });
    }

    // ensure user is part of ride
    let isAllowed = false;
    if (ride.driver_id.toString() === userId) isAllowed = true;
    else {
      const booking = await Booking.findOne({ ride_id: rideId, rider_id: userId, status: "Accepted" });
      if (booking) isAllowed = true;
    }
    if (!isAllowed) {
      return socket.emit("chatError", { message: "You are not part of this ride" });
    }

    // Determine driver and rider IDs
    let driverId, riderId;
    if (role === "driver") {
      driverId = userId;
      riderId = otherUserId;
    } else {
      riderId = userId;
      driverId = otherUserId;
    }


    // find or create conversation between userId and otherUserId
    let conversation = await Conversation.findOne({
      ride_id: rideId,
      driver_id: driverId,
      rider_id: riderId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        ride_id: rideId,
        driver_id: driverId,
        rider_id: riderId,
      });
    }

    // join socket room by conversationId
    socket.join(conversation._id.toString());
    console.log(`User ${userId} joined conversation ${conversation._id}`);
    socket.emit("joinedConversation", { conversationId: conversation._id });
  } catch (err) {
    console.error("Error in joinConversation:", err);
    socket.emit("chatError", { message: "Unable to join conversation" });
  }
});


  //  Handle sending message
  socket.on("sendMessage", async ({ conversationId, message, localId, replyTo,otherUserId }) => {
  try {
    const userId = socket.user.user_id;

    // Fetch conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return socket.emit("chatError", { message: "Conversation not found" });
    }
    console.log("driver_id:",conversation.rider_id.toString());
    console.log("UserId:",userId);
    // Check if user is either driver or rider
    if (
      conversation.driver_id.toString() !== userId &&
      conversation.rider_id.toString() !== userId
    ) {
      return socket.emit("chatError", { message: "Not part of this conversation" });
    }

    // Save message
    const saved = await ChatService.saveMessage({
      conversationId,
      rideId: conversation.ride_id,
      senderId: userId,
      senderRole: socket.user.role_name,
      message,
      replyTo,
      recipientId:otherUserId
    });

    const msg = {
      _id: saved._id,
      conversation_id: conversationId,
      sender: saved.sender_id,
      sender_name: saved.sender_name,
      role: saved.sender_role,
      message: saved.message,
      timestamp: saved.createdAt,
      replyTo: saved.reply_to,
      localId
    };

    console.log("sender:",msg.sender);

    io.to(conversationId.toString()).emit("receiveMessage", msg);
  } catch (err) {
    console.error("Error in sendMessage:", err);
    socket.emit("chatError", { message: "Unable to send message" });
  }
});



  //  Handle leaving room
  socket.on("leaveConversation", (conversationId) => {
    socket.leave(conversationId);
    console.log(`User ${socket.user.user_id} left conversation ${conversationId}`);
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
