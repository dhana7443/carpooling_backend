const ChatMessage=require("./chat.model");

exports.saveMessage = async ({ rideId, senderId, senderRole, message }) => {
  
  const doc = await ChatMessage.create({
    ride_id: rideId,
    sender_id: senderId,
    sender_role: senderRole,
    message
  });
  return doc;
  
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
