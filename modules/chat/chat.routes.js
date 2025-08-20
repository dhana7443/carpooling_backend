const express = require("express");
const router = express.Router();
const { deleteRideMessage, deleteMultipleRideMessages, createConversationMessage, getConversationMessages, createOrGetConversation} = require("./chat.controller");
const {authMiddleware}=require("../../middlewares/auth");

router.post('/private',authMiddleware,createOrGetConversation);
router.post("/conversation/:conversationId/message",authMiddleware,createConversationMessage);
router.get("/conversation/:conversationId/messages", authMiddleware, getConversationMessages);
router.delete("/message/:messageId",authMiddleware,deleteRideMessage);
router.post("/rides/:rideid/messages/delete",authMiddleware,deleteMultipleRideMessages);

module.exports = router;