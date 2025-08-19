const ChatService=require("./chat.service");

exports.createRideMessage=async(req,res)=>{
  try{
    const {rideId}=req.params;
    const {user_id,role_name}=req.user;
    const {msg,replyTo}=req.body;
    
    const saved=await ChatService.saveMessage({
      rideId,
      senderId: user_id,      
      senderRole: role_name,  
      message: msg ,
      replyTo
    })

    const msgCreated = {
      _id: saved._id,
      ride_id: saved.ride_id,
      sender: saved.sender_id.toString(),
      role: saved.sender_role,
      message: saved.message,
      reply_to: saved.reply_to ? { _id: saved.reply_to._id, message: saved.reply_to.message } : null,
      timestamp: saved.createdAt,
    };

    //broadcast to sockets in the ride room
    req.app.get("io").to(rideId).emit("receiveMessage",msgCreated);

    res.status(201).json(msgCreated);
  }catch(err){
    console.error("Error fetching ride messages:", err);
    res.status(500).json({ message: "Server error" });
  }
}


exports.getRideMessages = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { before, limit } = req.query;

    const messages = await ChatService.getHistory({
      rideId,
      before,
      limit: limit ? parseInt(limit) : 50,
    });

    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching ride messages:", err);
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