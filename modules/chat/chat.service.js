const ChatMessage=require("./chat.model");
const Conversation=require("../conversations/conversation.model");

exports.getOrCreateConversation = async ({ rideId, userId, recipientId, userRole }) => {
  let driverId, riderId;

  if (userRole === 'driver') {
    driverId = userId;
    riderId = recipientId;
  } else {
    riderId = userId;
    driverId = recipientId;
  }

  // Find existing conversation
  let conversation = await Conversation.findOne({
    ride_id: rideId,
    driver_id: driverId,
    rider_id: riderId,
  });

  if (!conversation) {
    // Create new conversation
    conversation = await Conversation.create({
      ride_id: rideId,
      driver_id: driverId,
      rider_id: riderId,
    });
  }

  return conversation;
};

exports.saveMessage = async ({ rideId, senderId, senderRole, message,replyTo ,recipientId}) => {
  
  let driverId, riderId;
  if (senderRole === "driver") {
    driverId = senderId;
    riderId = recipientId;
  } else {
    riderId = senderId;
    driverId = recipientId;
  }

  // 2. Find or create conversation
  let conversation = await Conversation.findOne({ ride_id: rideId, driver_id: driverId, rider_id: riderId });
  if (!conversation) {
    conversation = await Conversation.create({
      ride_id: rideId,
      driver_id: driverId,
      rider_id: riderId,
    });
  }

  // 3. Save message under this conversation
  const doc = await ChatMessage.create({
    conversation_id: conversation._id,
    sender_id: senderId,
    sender_role: senderRole,
    message,
    reply_to: replyTo || null,
  });

  conversation.lastMessage=message;
  await conversation.save();

  const populatedDoc = await ChatMessage.findById(doc._id)
  .populate("reply_to", "message sender_id")
  .populate("sender_id", "_id name");

  // Convert sender_id to string for consistent use
  const formattedDoc = {
    _id: populatedDoc._id,
    conversation_id: populatedDoc.conversation_id,
    sender_id: populatedDoc.sender_id._id.toString(), // ✅ always string
    sender_name: populatedDoc.sender_id.name,         // optional, for frontend
    sender_role: populatedDoc.sender_role,
    message: populatedDoc.message,
    reply_to: populatedDoc.reply_to
      ? {
          _id: populatedDoc.reply_to._id.toString(),
          message: populatedDoc.reply_to.message,
        }
      : null,
    createdAt: populatedDoc.createdAt,
  };
  
return formattedDoc;


};

exports.getConversationHistory = async ({ conversationId, limit = 50, before }) => {
  const query = { conversation_id: conversationId };
  if (before) query.createdAt = { $lt: new Date(before) };

  const docs = await ChatMessage
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender_id","_id name")
    .populate("reply_to","message sender_id")
    .lean();

    console.log("history:",docs);
  return docs.reverse(); // oldest → newest
};


// Delete a single message
exports.deleteMessage = async ({ messageId, userId }) => {
  const msg = await ChatMessage.findById(messageId);
  if (!msg) throw new Error("Message not found");

  if (msg.sender_id.toString() !== userId.toString()) {
    throw new Error("Not authorized to delete this message");
  }

  // Soft delete (preferred)
  msg.deleted = true;
  msg.message = "This message was deleted";
  await msg.save();

  return msg;
};

// Delete multiple messages
exports.deleteMultipleMessages = async ({ messageIds, userId }) => {
  const msgs = await ChatMessage.find({ _id: { $in: messageIds } });

  const updates = await Promise.all(
    msgs.map(async (msg) => {
      if (msg.sender_id.toString() === userId.toString()) {
        msg.deleted = true;
        msg.message = "This message was deleted";
        return msg.save();
      }
      return null;
    })
  );

  return updates.filter(Boolean);
};