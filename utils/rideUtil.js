
const Stop=require("../modules/stops/stop.model");

// utils/rideUtils.js
const getOrderedStops = async (route_id) => {
  const stops = await Stop.find({ route_id }).sort({ stop_order: 1 });
  return stops.map(s => s.stop_name) ; // Returns array like ['A', 'B', 'C', 'D', 'E']
};
