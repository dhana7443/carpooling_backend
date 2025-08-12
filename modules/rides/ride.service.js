const Ride = require("./ride.model");
const Stop = require("../stops/stop.model");
const Route = require("../routes/route.model");
const RideRequest=require("../rideRequests/rideRequest.model");


const createRide = async ({
  origin_stop_id,
  destination_stop_id,
  departure_time,
  available_seats
}, { user_id }) => {
  console.log('service file');
  const existingRide = await Ride.findOne({
    driver_id: user_id,
    status: "Active"
  });

  if (existingRide) {
    throw new Error("You already have an active ride. Complete or cancel it before creating a new one.");
  }

  const originStop = await Stop.findById(origin_stop_id);
  const destinationStop = await Stop.findById(destination_stop_id);

  if (!originStop || !destinationStop) {
    throw new Error("Invalid origin or destination stop");
  }

  if (originStop.route_id.toString() !== destinationStop.route_id.toString()) {
    throw new Error("Origin and destination must belong to the same route");
  }

  const ride = new Ride({
    driver_id: user_id,
    origin_stop_id: originStop._id,
    destination_stop_id: destinationStop._id,
    route_id: originStop.route_id,
    departure_time,
    available_seats
  });

  await ride.save();

  // Get all stops on the route
  const stops = await Stop.find({ route_id: originStop.route_id })
    .sort({ stop_order: 1 })
    .select('_id stop_name stop_order');
  console.log(stops)
  // Get all subroutes (from-to pairs) for this route
  const subroutes = await Route.find({ route_id: originStop.route_id })
    .select('start_stop_id end_stop_id distance time cost');
  console.log(subroutes)
  // Format: Map for faster lookup of stop name by ID
  const stopMap = new Map();
  stops.forEach(stop => stopMap.set(stop._id.toString(), stop.stop_name));
  console.log(stopMap);
  // Attach subroute info with stop names
  const subrouteDetails = subroutes.map(sr => ({
    from_stop_id: sr.start_stop_id,
    from_stop_name: stopMap.get(sr.start_stop_id.toString()),
    to_stop_id: sr.end_stop_id,
    to_stop_name: stopMap.get(sr.end_stop_id.toString()),
    distance: sr.distance,
    time: sr.time,
    cost: sr.cost
  }));
  console.log(subrouteDetails);
  return {
    message: "Ride created successfully",
    ride_id: ride._id,
    originStopName: originStop.stop_name,
    destinationStopName: destinationStop.stop_name,
    departure_time,
    available_seats,
    route_id: originStop.route_id,
    subroutes: subrouteDetails
  };
};


const searchRidesByIntermediateStops = async (startStopName, endStopName, datetime) => {
  const startStops = await Stop.find({ stop_name: startStopName });
  const endStops = await Stop.find({ stop_name: endStopName });

  if (!startStops.length || !endStops.length) {
    throw new Error("Start or end stop not found.");
  }

  const validPairs = [];

  for (const startStop of startStops) {
    for (const endStop of endStops) {
      if (
        startStop.route_id.toString() === endStop.route_id.toString() &&
        startStop.stop_order < endStop.stop_order
      ) {
        validPairs.push({ startStop, endStop });
      }
    }
  }
  console.log(validPairs)
  if (!validPairs.length) {
    throw new Error("No valid route segments found between the selected stops.");
  }

  // Parse datetime from frontend
  const inputDateTime = new Date(datetime);
  console.log(inputDateTime);
  // Get the start and end of the same day (today)
  const startOfDay = new Date(inputDateTime);
  startOfDay.setUTCHours(0, 0, 0, 0);
  console.log(startOfDay)
  const endOfDay = new Date(inputDateTime);
  endOfDay.setUTCHours(23, 59, 59, 999);
  console.log(endOfDay)
  let matchedRides = [];

  for (const { startStop, endStop } of validPairs) {
    const rides = await Ride.find({
      route_id: startStop.route_id,
      departure_time: {
        $gte: inputDateTime, // rides from now onward
        $lte: endOfDay,       // same day
      },
      status: "Active",
    })
      .populate("driver_id", "name email -_id")
      .populate("origin_stop_id", "stop_order stop_name -_id")
      .populate("destination_stop_id", "stop_order stop_name -_id");

    const segmentRides = rides.filter((ride) => {
      return (
        ride.origin_stop_id.stop_order <= startStop.stop_order &&
        ride.destination_stop_id.stop_order >= endStop.stop_order
      );
    });
    console.log(segmentRides);
    // Route info between selected stops
    const routeInfo = await Route.findOne({
      start_stop_id: startStop._id,
      end_stop_id: endStop._id,
    });
    console.log(routeInfo);
    const routeStops = await Stop.find({ route_id: startStop.route_id })
      .sort("stop_order")
      .select("stop_name stop_order -_id");
    console.log(routeStops)

    for (const ride of segmentRides){
      //get segment based available seats
      const segmentAvailableSeats=await getSegmentAvailability(
        ride._id,
        ride.route_id,
        startStop.stop_name,
        endStop.stop_name
      )

      matchedRides.push({
        ride_id: ride._id,
        driver_id: ride.driver_id || null,
        driver_name: ride.driver_id?.name || null,
        driver_email: ride.driver_id?.email || null,
        origin_stop_name: ride.origin_stop_id?.stop_name || null,
        destination_stop_name: ride.destination_stop_id?.stop_name || null,
        route_id: ride.route_id,
        departure_time: ride.departure_time,
        available_seats: ride.available_seats,
        segment_available_seats: segmentAvailableSeats, //  ADDED
        status: ride.status,
        route_stops: routeStops.map((stop) => ({
          stop_name: stop.stop_name,
          stop_order: stop.stop_order,
        })),
        distance: routeInfo?.distance || null,
        time: routeInfo?.time || null,
        cost: routeInfo?.cost || null,
      });
    }
    
  }
  console.log(matchedRides)

  return matchedRides;
};


//get-rides
const getActiveRidesByDriver = async (driverId) => {
  const rides = await Ride.find({ driver_id: driverId ,status:"Active"})
    .populate("driver_id", "name -_id") 
    .populate("origin_stop_id", "stop_name -_id")
    .populate("destination_stop_id", "stop_name -_id")
    .sort({ departure_time: -1 }); // most recent first

  // Map rides to clean output format
  const formattedRides = rides.map(ride => ({
    ride_id:ride._id,
    driver_id:ride.driver_id,
    driver_name: ride.driver_id?.name || null,
    origin_stop_name: ride.origin_stop_id?.stop_name || null,
    destination_stop_name: ride.destination_stop_id?.stop_name || null,
    route_id: ride.route_id || null,
    departure_time: ride.departure_time,
    available_seats: ride.available_seats,
    status: ride.status,
  }));
  
  return formattedRides;
};

//update-ride
const updateRideById = async (rideId, driverId, updates) => {
  // Only allow certain fields to be updated
  const allowedFields = ['origin_stop_id', 'destination_stop_id', 'departure_time', 'available_seats'];
  const filteredUpdates = {};

  for (let key of allowedFields) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  // If origin or destination stop is changing, validate and get route_id
  if (filteredUpdates.origin_stop_id || filteredUpdates.destination_stop_id) {
    const ride = await Ride.findById(rideId);
    if (!ride || ride.driver_id.toString() !== driverId.toString()) {
      throw new Error("Ride not found or not owned by this driver");
    }

    const originStopId = filteredUpdates.origin_stop_id || ride.origin_stop_id;
    const destinationStopId = filteredUpdates.destination_stop_id || ride.destination_stop_id;

    const originStop = await Stop.findById(originStopId);
    const destinationStop = await Stop.findById(destinationStopId);

    if (!originStop || !destinationStop) {
      throw new Error("Invalid origin or destination stop");
    }

    if (originStop.route_id.toString() !== destinationStop.route_id.toString()) {
      throw new Error("Origin and destination must belong to the same route");
    }

    // Add route_id to update
    filteredUpdates.route_id = originStop.route_id;
  }

  // Find and update only if ride belongs to the current driver
  const updatedRide = await Ride.findOneAndUpdate(
    { _id: rideId, driver_id: driverId },
    { $set: filteredUpdates },
    { new: true }
  );

  return updatedRide;
};


//delete-ride
const deleteRide=async(rideId,driverId)=>{

  const ride = await Ride.findOne({
    _id: rideId,
    driver_id: driverId,
    status: "Active"
  })

  if (!ride) {
    return res.status(404).json({ message: "Ride not found or already cancelled" });
  }

  ride.status = "Cancelled";
  await ride.save();
  return ride;
}

// ride.service.js
const completeRide = async (rideId, driverId) => {
  const ride = await Ride.findOne({
    _id: rideId,
    driver_id: driverId,
    status: "Active"
  });

  if (!ride) {
    throw new Error("Ride not found or already cancelled");
  }

  ride.status = "Completed";
  await ride.save();
  return ride;
};




const getRideDetails = async (ride_id, { user_id }) => {
  const ride = await Ride.findOne({ _id: ride_id, driver_id: user_id });

  if (!ride) {
    throw new Error("Ride not found or you are not authorized to view it.");
  }

  const originStop = await Stop.findById(ride.origin_stop_id);
  const destinationStop = await Stop.findById(ride.destination_stop_id);

  if (!originStop || !destinationStop) {
    throw new Error("Invalid origin or destination stop associated with the ride");
  }

  // Get all stops on the same route
  const stops = await Stop.find({ route_id: ride.route_id })
    .sort({ stop_order: 1 })
    .select('_id stop_name stop_order');

  // Get all subroutes for this route
  const subroutes = await Route.find({ route_id: ride.route_id })
    .select('start_stop_id end_stop_id distance time cost');

  // Create a map of stop_id => stop_name
  const stopMap = new Map();
  stops.forEach(stop => stopMap.set(stop._id.toString(), stop.stop_name));

  // Attach subroute info with stop names
  const subrouteDetails = subroutes.map(sr => ({
    from_stop_id: sr.start_stop_id,
    from_stop_name: stopMap.get(sr.start_stop_id.toString()),
    to_stop_id: sr.end_stop_id,
    to_stop_name: stopMap.get(sr.end_stop_id.toString()),
    distance: sr.distance,
    time: sr.time,
    cost: sr.cost
  }));

  return {
    message: "Ride details fetched successfully",
    ride_id: ride._id,
    originStopName: originStop.stop_name,
    origin_stop_id:ride.origin_stop_id,
    destinationStopName: destinationStop.stop_name,
    destination_stop_id:ride.destination_stop_id,
    departure_time: ride.departure_time,
    available_seats: ride.available_seats,
    route_id: ride.route_id,
    subroutes: subrouteDetails
  };
};


const buildSegmentOccupancy = async (ride_id, route_id) => {
  const stops = await Stop.find({ route_id }).sort({ stop_order: 1 });
  const orderedStopNames = stops.map(s => s.stop_name);

  const segmentOccupancy = {};
  for (let i = 0; i < orderedStopNames.length - 1; i++) {
    const segment = `${orderedStopNames[i]}-${orderedStopNames[i + 1]}`;
    segmentOccupancy[segment] = 0;
  }

  const acceptedRequests = await RideRequest.find({
    ride_id,
    status: { $in: ["Pending", "Accepted","CompletedByRider"] }
  });

  for (const req of acceptedRequests) {
    const fromIndex = orderedStopNames.indexOf(req.from_stop);
    const toIndex = orderedStopNames.indexOf(req.to_stop);
    if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) continue;
    for (let i = fromIndex; i < toIndex; i++) {
      const segment = `${orderedStopNames[i]}-${orderedStopNames[i + 1]}`;
      segmentOccupancy[segment] += 1;
    }
  }

  return { orderedStopNames, segmentOccupancy };
};

const getSegmentAvailability = async (ride_id, route_id, from_stop, to_stop) => {
  const ride = await Ride.findById(ride_id);
  if (!ride) throw new Error("Ride not found");

  const { orderedStopNames, segmentOccupancy } = await buildSegmentOccupancy(ride_id, route_id);

  const fromIndex = orderedStopNames.indexOf(from_stop);
  const toIndex = orderedStopNames.indexOf(to_stop);

  if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
    throw new Error("Invalid stop selection");
  }

  let maxOccupied = 0;
  for (let i = fromIndex; i < toIndex; i++) {
    const segmentKey = `${orderedStopNames[i]}-${orderedStopNames[i + 1]}`;
    const occupancy = segmentOccupancy[segmentKey] || 0;
    maxOccupied = Math.max(maxOccupied, occupancy);
  }

  const seatsLeft = ride.available_seats - maxOccupied;
  return seatsLeft > 0 ? seatsLeft : 0;
};



const canAcceptRideRequest = async (ride_id, route_id, from_stop, to_stop) => {
  console.log(" canAcceptRideRequest called");
  console.log("  ride_id:", ride_id);
  console.log("  route_id:", route_id);
  console.log("  from:", from_stop, "to:", to_stop);

  const ride = await Ride.findById(ride_id);
  console.log(ride);
  if (!ride) throw new Error("Ride not found");

  const { segmentOccupancy, orderedStopNames } = await buildSegmentOccupancy(ride_id, route_id);
  console.log({segmentOccupancy,orderedStopNames});
  console.log(from_stop,to_stop);
  const fromIndex = orderedStopNames.indexOf(from_stop);
  const toIndex = orderedStopNames.indexOf(to_stop);

  if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
    throw new Error("Invalid stop selection");
  }

  // Check segment occupancy against total available seats
  for (let i = fromIndex; i < toIndex; i++) {
    const segmentKey = `${orderedStopNames[i]}-${orderedStopNames[i + 1]}`;
    const occupancy = segmentOccupancy[segmentKey] || 0;

    if (occupancy >= ride.available_seats) {
      return false; // segment full
    }
  }

  return true; // all segments available
};




const getRiderPreviousRides = async (user_id) => {
  console.log('hello')
  console.log(user_id);
  //  Fetch accepted ride requests with requested stops
  const requests = await RideRequest.find({
    rider_id: user_id,
    status: "CompletedByRider",
  }).select('from_stop to_stop');
  console.log(requests);
  if (!requests.length) {
    return [];
  }

  //  Collect unique stop names
  const stopNames = new Set();
  requests.forEach(req => {
    stopNames.add(req.from_stop);
    stopNames.add(req.to_stop);
  });

  //  Fetch stops to get their IDs
  const stops = await Stop.find({ stop_name: { $in: Array.from(stopNames) } }).select('_id stop_name');

  const stopMap = {};
  stops.forEach(stop => {
    stopMap[stop.stop_name] = stop._id;
  });

  //  Build response with IDs
  const formattedRidesRaw = requests.map(req => ({
    req_id:req._id,
    from: req.from_stop,
    to: req.to_stop,
    from_id: stopMap[req.from_stop] || null,
    to_id: stopMap[req.to_stop] || null,
  }));

  //  Remove duplicates by (from_id, to_id) pair
  const uniqueMap = new Map();
  formattedRidesRaw.forEach(ride => {
    const key = `${ride.from}-${ride.to}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, ride);
    }
  });

  const formattedRides = Array.from(uniqueMap.values());
  
  return formattedRides;
};

module.exports={
  createRide,
  searchRidesByIntermediateStops,
  getActiveRidesByDriver,
  updateRideById,
  deleteRide,
  getRideDetails,
  buildSegmentOccupancy,
  getSegmentAvailability,
  canAcceptRideRequest,
  getRiderPreviousRides,
  completeRide
};
