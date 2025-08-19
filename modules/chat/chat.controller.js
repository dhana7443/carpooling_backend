const ChatService=require("./chat.service");

exports.createRideMessage=async(req,res)=>{
  try{
    const {rideId}=req.params;
    const {user_id,role_name}=req.user;
    const {msg}=req.body;
    
    const saved=await ChatService.saveMessage({
      rideId,
      senderId: user_id,      
      senderRole: role_name,  
      message: msg 
    })

    const msgCreated = {
      _id: saved._id,
      ride_id: saved.ride_id,
      sender: saved.sender_id.toString(),
      role: saved.sender_role,
      message: saved.message,
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