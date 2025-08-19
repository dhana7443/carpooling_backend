const express = require("express");
const userRoutes = require("./modules/users/user.routes");
const stopRoutes=require("./modules/stops/stop.routes");
const routeRoutes=require("./modules/routes/route.routes");
const rideRoutes=require("./modules/rides/ride.routes");
const rideRequestRoutes=require("./modules/rideRequests/rideRequest.routes")
const notificationRoutes=require('./modules/notifications/notification.routes');
const paymentRoutes=require('./modules/payments/payment.routes');
const walletRoutes=require('./modules/wallets/wallet.routes');
const chatRoutes=require("./modules/chat/chat.routes");



const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is working!");
});
app.use("/api/users", userRoutes);
app.use("/api/stops",stopRoutes);
app.use("/api/routes",routeRoutes);
app.use("/api/rides",rideRoutes);
app.use("/api/ride-requests",rideRequestRoutes);
app.use("/api/notifications",notificationRoutes);
app.use("/api/payments",paymentRoutes);
app.use("/api/wallets",walletRoutes);
app.use("/api/chats",chatRoutes);

module.exports = app;
