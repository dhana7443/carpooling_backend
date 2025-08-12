const RideRequest = require("./rideRequest.model");
const Ride=require("../rides/ride.model");
const User=require("../users/user.model");
const Stop=require("../stops/stop.model");
const admin=require("../../config/firebase");


exports.createRideRequest = async (riderId, rideId, fromStop, toStop) => {
  const existing = await RideRequest.findOne({
    rider_id: riderId,
    ride_id: rideId,
    from_stop: fromStop,
    to_stop: toStop,
    status:"Pending" || "Accepted"
  });
  if (existing) {
    throw new Error("Ride request already sent for this route.");
  }

  const request = new RideRequest({
    rider_id: riderId,
    ride_id: rideId,
    from_stop: fromStop,
    to_stop: toStop
  });

  await request.save();

  //  Send notification to the driver
  const ride = await Ride.findById(rideId);
  const driver = await User.findById(ride.driver_id);
  const rider = await User.findById(riderId);
  console.log("driver fetched:",driver);
  if (driver?.fcmToken) {
    try{
      await admin.messaging().send({
      token: driver.fcmToken,
      notification: {
        title: ' New Ride Request',
        body: `${rider.name} requested a ride from ${fromStop} to ${toStop}`,
      },
      data: {
        rideId: rideId.toString(),
        riderId: riderId.toString()
      }
    });
    }catch(rror){
      console.error("FCM send error:", error);
    }
    
  }else{
    console.log("Driver has no FCM token stored, cannot send notification.");
  }

  console.log(driver);
  return request;
};



exports.getRequestsByRider = async (riderId) => {
  const requests = await RideRequest.find({ rider_id: riderId })
    .populate({
      path: "ride_id",
      populate: [
        { path: "origin_stop_id", select: "stop_name -_id" },
        { path: "destination_stop_id", select: "stop_name -_id" }
      ],
      select: "origin_stop_id destination_stop_id departure_time"
    })
    .sort({ requested_at: -1 });

  // Format clean response
  return requests.map(req => ({
    ride_id: req.ride_id?._id,
    origin_stop_name: req.ride_id?.origin_stop_id?.stop_name || null,
    destination_stop_name: req.ride_id?.destination_stop_id?.stop_name || null,
    departure_time: req.ride_id?.departure_time || null,
    status: req.status,
    requested_at: req.requested_at
  }));
};

//ride-status
exports.updateRideRequestStatus = async (requestId, status, driverId) => {
  if (!["Accepted", "Rejected"].includes(status)) {
    throw new Error("Invalid status. Must be 'Accepted' or 'Rejected'.");
  }

  const rideRequest = await RideRequest.findById(requestId).populate('rider_id');
  if (!rideRequest) {
    throw new Error("Ride request not found");
  }
  console.log(rideRequest);
  
  // Check if driver owns the ride for this request
  const ride = await Ride.findById(rideRequest.ride_id);
  if (!ride) throw new Error("Associated ride not found");
  console.log(ride);
  if (ride.driver_id.toString() !== driverId) {
    throw new Error("Unauthorized: You can only update requests for your rides");
  }
  
  rideRequest.status = status;
  await rideRequest.save();
  const rider=rideRequest.rider_id;
  if (rider.fcmToken){
    let message='';
    if (status==='Accepted') message='Congratulations! Your ride request has been accepted!';
    else if (status=='Rejected') message='Sorry, Your ride request was rejected.';

    await admin.messaging().send({
      token: rider.fcmToken,
      notification: {
        title: 'Ride Request Update',
        body: message,
      },
    });
    console.log(message);
  }
  return rideRequest;
};


exports.getRequestsForRide = async (rideId, driverId) => {
  console.log(rideId);
  console.log(driverId);
  const ride = await Ride.findOne({ _id: rideId, driver_id: driverId });
  console.log(ride);
  if (!ride) {
    throw new Error("Ride not found or unauthorized access");
  }
  const [originStop, destinationStop, requests] = await Promise.all([
    Stop.findById(ride.origin_stop_id),
    Stop.findById(ride.destination_stop_id),
    RideRequest.find({ ride_id: ride._id }).populate("rider_id", "_id name email"),
  ]);
  console.log(originStop,destinationStop,requests);
  return {
    ride_id: ride._id,
    origin: originStop?.stop_name || "Unknown",
    destination: destinationStop?.stop_name || "Unknown",
    departure_time: ride.departure_time,
    available_seats: ride.available_seats,
    status: ride.status,
    requests: requests.map((req) => ({
      rider_from_stop: req.from_stop,
      rider_to_stop: req.to_stop,
      request_id: req._id,
      status: req.status,
      requested_at: req.requested_at,
      rider: {
        id: req.rider_id._id,
        name: req.rider_id.name,
        email: req.rider_id.email,
      },
    })),
  };
};

// services/rideRequest.service.js

exports.markRequestsAsSeen = async (rideId) => {
  await RideRequest.updateMany(
    { ride_id: rideId, is_seen: false },
    { $set: { is_seen: true } }
  );
};

exports.getUnseenRequestCount = async (rideId) => {
  const count = await RideRequest.countDocuments({
    ride_id: rideId,
    status: 'Pending',
    is_seen: false,
  });
  return count;
};

exports.getRiderRequests = async (user_id) => {
  // Fetch all ride requests made by this rider
  const now=new Date();
  const requests = await RideRequest.find({ rider_id: user_id,status: { $in: ['Pending', 'Accepted','CompletedByRider'] } })
    .populate({
      path: 'ride_id',
      match:{status:'Active'},
      select: 'origin_stop_id destination_stop_id departure_time',
      populate: [
        { path: 'origin_stop_id', select: 'stop_name' },
        { path: 'destination_stop_id', select: 'stop_name' },
      ],
    })
    .select('ride_id from_stop to_stop status requested_at')
    .sort({ requested_at: -1 }); // latest first
  console.log(requests);

  const filtered = requests.filter(req => {
  if (!req.ride_id) return false;
  return new Date(req.ride_id.departure_time) >= now;
  });
  // Format response
  const formatted = filtered.map((req) => ({
    request_id: req._id,
    status: req.status,
    requested_at: req.requested_at,
    from: req.from_stop,
    to: req.to_stop,
    ride: req.ride_id
      ? {
          ride_id: req.ride_id._id,
          from: req.ride_id.origin_stop_id.stop_name,
          to: req.ride_id.destination_stop_id.stop_name,
          departure_time: req.ride_id.departure_time,
        }
      : null,
  }));
  

  return formatted;
};

exports.cancelRideRequest = async (user_id, request_id) => {
  // Find the request
  const request = await RideRequest.findById(request_id);

  if (!request) {
    throw new Error('Ride request not found.');
  }

  if (request.rider_id.toString() !== user_id.toString()) {
    throw new Error('You are not authorized to cancel this request.');
  }

  if (request.status === 'Cancelled') {
    throw new Error('Request is already cancelled.');
  }

  if (request.status === 'Rejected') {
    throw new Error('Cannot cancel a rejected request.');
  }

  // Update status
  request.status = 'Cancelled';
  await request.save();

  return request;
};

exports.riderMarkComplete=async(requestId,riderId)=>{
  const request = await RideRequest.findById(requestId);
  if (!request) {
    throw new Error("Ride request not found");
  }

  if (request.rider_id.toString() !== riderId) {
    throw new Error("You are not authorized to mark this ride complete");
  }

  if (request.status !== "Accepted") {
    throw new Error("Ride is not in an Accepted state, cannot mark as complete");
  }

  request.status = "CompletedByRider";
  await request.save();

  return request;
};
