const rideRequestService = require("./rideRequest.service");

exports.sendRideRequest = async (req, res) => {
  try {
    const riderId = req.user.user_id; // from authMiddleware
    console.log(riderId);
    const { ride_id,from_stop,to_stop} = req.body;
    console.log(ride_id,from_stop,to_stop);
    const request = await rideRequestService.createRideRequest(riderId, ride_id,from_stop,to_stop);
    res.status(201).json({ message: "Ride request sent successfully", request });
    console.log({request});
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getRiderRequests = async (req, res) => {
    try {
      const riderId = req.user.user_id;
  
      const requests = await rideRequestService.getRequestsByRider(riderId);
      res.json({ requests });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  
  
  exports.updateRequestStatus = async (req, res) => {
    try {
      const { requestId } = req.params;
      const { status } = req.body;
      const driverId = req.user.user_id; // from auth middleware
      console.log(status);
      console.log(driverId);
      console.log(requestId);
      
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
  
      const updatedRequest = await rideRequestService.updateRideRequestStatus(requestId, status, driverId);
      res.json({ message: `Request ${status.toLowerCase()} successfully`, updatedRequest });
      console.log({updatedRequest});
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  

  exports.getRideRequestsByRideId = async (req, res) => {
    try {
      const { rideId } = req.params;
      const driverId = req.user.user_id; // from authMiddleware
      console.log(rideId);
      console.log(driverId);
      const result = await rideRequestService.getRequestsForRide(rideId, driverId);
      console.log(result);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching ride requests:", error.message);
      res.status(500).json({ message: "Server error while fetching ride requests" });
    }
  };

  // GET unseen request count
exports.getUnseenRequestCount = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const count = await rideRequestService.getUnseenRequestCount(ride_id);
    console.log(count);
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get unseen requests', error: error.message });
  }
};

// PUT mark requests as seen
exports.markRequestsAsSeen = async (req, res) => {
  try {
    const { ride_id } = req.params;
    console.log(ride_id);
    await rideRequestService.markRequestsAsSeen(ride_id);
    res.status(200).json({ message: 'Requests marked as seen' });
    console.log("good");
  } catch (error) {
    res.status(500).json({ message: 'Failed to update requests', error: error.message });
  }
};

exports.getRiderRequests = async (req, res) => {
  const user_id = req.user.user_id; // coming from your auth middleware after verifying JWT
  const requests = await rideRequestService.getRiderRequests(user_id);

  res.status(200).json({
    status: 'success',
    requests,
  });
};


exports.cancelRideRequest = async (req, res) => {
  const user_id = req.user.user_id;
  const request_id = req.params.id;

  const result = await rideRequestService.cancelRideRequest(user_id, request_id);
  console.log(result);
  res.status(200).json({
    status: 'success',
    message: 'Ride request cancelled successfully.',
    data: result,
  });
};

exports.riderMarkComplete=async(req,res)=>{
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const updatedRequest = await rideRequestService.riderMarkComplete(id, userId);

    res.json({
      message: "Ride marked as completed by rider",
      request: updatedRequest,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
