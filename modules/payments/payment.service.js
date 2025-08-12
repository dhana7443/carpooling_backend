const RideRequest=require('../rideRequests/rideRequest.model');
const Ride=require('../rides/ride.model');
const Route=require('../routes/route.model');
const Stop=require('../stops/stop.model');

exports.getRideCost = async (request_id) => {
  const request = await RideRequest.findById(request_id);
  if (!request) throw new Error('Ride request not found');

  const ride = await Ride.findById(request.ride_id);
  if (!ride) throw new Error('Associated ride not found');

  const fromStop = await Stop.findOne({
    stop_name: request.from_stop,
    route_id: ride.route_id
  });
  if (!fromStop) throw new Error('From stop not found');

  const toStop = await Stop.findOne({
    stop_name: request.to_stop,
    route_id: ride.route_id
  });
  if (!toStop) throw new Error('To stop not found');

  const routeSegment = await Route.findOne({
    route_id: ride.route_id,
    start_stop_id: fromStop._id,
    end_stop_id: toStop._id
  });
  if (!routeSegment) throw new Error('Route segment not found');

  return {
    ride_cost: routeSegment.cost,
    driver_id: ride.driver_id,
    rider_id: request.rider_id,
    from_stop: request.from_stop,
    to_stop: request.to_stop,
    status: request.status,
  };
};