const ChatService=require("./chat.service");

exports.createOrGetConversation = async (req, res) => {
  try {
    const { rideId, recipientId } = req.body;
    const { user_id,role_name } = req.user;

    if (!rideId || !recipientId) {
      return res.status(400).json({ message: 'rideId and recipientId are required' });
    }

    const conversation = await ChatService.getOrCreateConversation({
      rideId,
      userId: user_id,
      recipientId,
      userRole:role_name
    });

    res.status(200).json({ conversationId: conversation._id });
  } catch (err) {
    console.error('Error in createOrGetConversation:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createConversationMessage = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { user_id, role_name } = req.user;
    const { msg, replyTo, recipientId } = req.body;  // recipientId is new

    const saved = await ChatService.saveMessage({
      rideId,
      senderId: user_id,
      senderRole: role_name,
      message: msg,
      replyTo,
      recipientId
    });

    const msgCreated = {
      _id: saved._id,
      conversation_id: saved.conversation_id,
      sender: saved.sender_id,
      role: saved.sender_role,
      message: saved.message,
      reply_to: saved.reply_to ? { _id: saved.reply_to._id, message: saved.reply_to.message } : null,
      timestamp: saved.createdAt,
    };

    // broadcast to the socket room for this conversation
    req.app.get("io").to(saved.conversation_id.toString()).emit("receiveMessage", msgCreated);

    res.status(201).json(msgCreated);
  } catch (err) {
    console.error("Error creating ride message:", err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { before, limit } = req.query;

    const messages = await ChatService.getConversationHistory({
      conversationId,
      before,
      limit: limit ? parseInt(limit) : 50,
    });

    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching conversation messages:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// delete single message
exports.deleteRideMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { user_id } = req.user;

    const deleted = await ChatService.deleteMessage({ messageId, userId: user_id });
    res.status(200).json(deleted);
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(400).json({ message: err.message });
  }
};

// delete multiple messages
exports.deleteMultipleRideMessages = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { messageIds } = req.body; // array
    const { user_id } = req.user;

    const deleted = await ChatService.deleteMultipleMessages({ messageIds, userId: user_id });
    res.status(200).json(deleted);
  } catch (err) {
    console.error("Error deleting multiple messages:", err);
    res.status(400).json({ message: err.message });
  }
};