const express = require("express");
const router = express.Router();
const {getRideMessages, createRideMessage} = require("./chat.controller");
const {authMiddleware}=require("../../middlewares/auth");


router.post("/rides/:rideId/message",authMiddleware,createRideMessage);
router.get("/rides/:rideId/messages", authMiddleware, getRideMessages);

module.exports = router;