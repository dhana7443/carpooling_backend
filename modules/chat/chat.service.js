const ChatMessage=require("./chat.model");

exports.saveMessage = async ({ rideId, senderId, senderRole, message,replyTo }) => {
  
  const doc = await ChatMessage.create({
    ride_id: rideId,
    sender_id: senderId,
    sender_role: senderRole,
    message,
    reply_to:replyTo
  });
  return doc.populate("reply_to","message sender_id");
};

exports.getHistory = async ({ rideId, limit = 50, before }) => {
  const query = { ride_id: rideId };
  if (before) query.createdAt = { $lt: new Date(before) };

  const docs = await ChatMessage
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

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