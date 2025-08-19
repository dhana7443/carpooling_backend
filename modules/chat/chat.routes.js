const express = require("express");
const router = express.Router();
const {getRideMessages, createRideMessage,deleteRideMessage, deleteMultipleRideMessages} = require("./chat.controller");
const {authMiddleware}=require("../../middlewares/auth");


router.post("/rides/:rideId/message",authMiddleware,createRideMessage);
router.get("/rides/:rideId/messages", authMiddleware, getRideMessages);
router.delete("/rides/:rideId/message/:messageId",authMiddleware,deleteRideMessage);
router.post("/rides/:rideid/messages/delete",authMiddleware,deleteMultipleRideMessages);

module.exports = router;