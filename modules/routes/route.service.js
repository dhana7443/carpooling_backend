const RouteStop = require("./route.model");
const Stop = require("../stops/stop.model");

exports.createRouteStopByNames = async ({ start_stop_name, end_stop_name, distance, time, cost }) => {
  const startStop = await Stop.findOne({ stop_name: start_stop_name });
  const endStop = await Stop.findOne({ stop_name: end_stop_name });

  if (!startStop || !endStop) {
    throw new Error("Start or End stop name is invalid");
  }

  return await RouteStop.create({
    start_stop_id: startStop._id,
    end_stop_id: endStop._id,
    distance,
    time,
    cost,
  });
};


exports.getAllRoutes = async () => {
  const routes = await RouteStop.find()
    .populate("start_stop_id", "stop_name")
    .populate("end_stop_id", "stop_name");
  console.log(routes);
  return routes.map(route => ({
    start_stop: route.start_stop_id.stop_name,
    end_stop: route.end_stop_id.stop_name,
    distance: route.distance,
    time: route.time,
    cost: route.cost
  }));
};

exports.getRouteById = async (id) => {
  const route=await RouteStop.findById(id)
  .populate("start_stop_id", "stop_name")
  .populate("end_stop_id", "stop_name");
   console.log(route)
  return route;
};


exports.getStartStops = async () => {
  const routes = await RouteStop.find()
    .populate('start_stop_id', 'stop_name')
    .select('start_stop_id');

  const stopMap = new Map();

  for (const route of routes) {
    const stop = route.start_stop_id;

    if (stop) {
      const stopName = stop.stop_name;
      const stopIdStr = String(stop._id);

      if (!stopMap.has(stopName)) {
        stopMap.set(stopName, new Set([stopIdStr]));
      } else {
        stopMap.get(stopName).add(stopIdStr); // Set automatically removes duplicates
      }
    }
  }

  // Convert sets to arrays
  const groupedStops = Array.from(stopMap.entries()).map(([stop_name, stopIdsSet]) => ({
    stop_name,
    stop_ids: Array.from(stopIdsSet)
  }));

  return groupedStops;
  
};



// exports.getEndStops = async (startStopName) => {
//   // Get all stops with the given name
//   const startStops = await Stop.find({ stop_name: startStopName });

//   if (!startStops.length) {
//     throw new Error("Start stop not found.");
//   }

//   // Collect all _id values
//   const startStopIds = startStops.map(stop => stop._id);

//   // Fetch all routes starting from any of the matched stop IDs
//   const routes = await RouteStop.find({ start_stop_id: { $in: startStopIds } })
//     .populate('end_stop_id', 'stop_name');

//   if (!routes.length) {
//     throw new Error("No end stops found for the given start stop.");
//   }

//   // Remove duplicates based on end_stop_id
//   const uniqueEndStops = new Map();

//   for (const route of routes) {
//     const endStop = route.end_stop_id;
//     if (endStop && !uniqueEndStops.has(String(endStop._id))) {
//       uniqueEndStops.set(String(endStop._id), {
//         _id: endStop._id,
//         end_stop_name: endStop.stop_name,
//         distance: route.distance,
//         time: route.time,
//         cost: route.cost
//       });
//     }
//   }

//   return Array.from(uniqueEndStops.values());
// };


exports.getEndStops = async (startStopName) => {
  const startStops = await Stop.find({ stop_name: startStopName });

  if (!startStops.length) {
    throw new Error("Start stop not found.");
  }

  // Collect all ObjectIds of stops with the same name
  const startStopIds = startStops.map(stop => stop._id);

  const routes = await RouteStop.find({
    start_stop_id: { $in: startStopIds }
  }).populate('end_stop_id', 'stop_name');

  if (!routes.length) {
    throw new Error("No end stops found for the given start stop.");
  }

  // Group end stops by stop_name
  const endStopMap = new Map();

  for (const route of routes) {
    const endStop = route.end_stop_id;
    const key = endStop.stop_name;

    if (!endStopMap.has(key)) {
      endStopMap.set(key, {
        stop_name: key,
        stop_ids: [],
        // routes: []
      });
    }

    endStopMap.get(key).stop_ids.push(String(endStop._id));
    // endStopMap.get(key).routes.push({
    //   _id: endStop._id,
    //   distance: route.distance,
    //   time: route.time,
    //   cost: route.cost
    // });
  }

  return Array.from(endStopMap.values());
};

exports.getRouteBetweenStops = async (startStopName, endStopName) => {
  const startStop = await Stop.findOne({ stop_name: startStopName });
  const endStop = await Stop.findOne({ stop_name: endStopName });

  if (!startStop || !endStop) {
    throw new Error("One or both stops not found.");
  }

  const route = await RouteStop.findOne({
    start_stop_id: startStop._id,
    end_stop_id: endStop._id,
  }).populate('start_stop_id end_stop_id', 'stop_name');

  if (!route) {
    throw new Error("Route not found between given stops.");
  }

  return {
    start_stop: {
      _id: route.start_stop_id._id,
      stop_name: route.start_stop_id.stop_name,
    },
    end_stop: {
      _id: route.end_stop_id._id,
      stop_name: route.end_stop_id.stop_name,
    },
    distance: route.distance,
    time: route.time,
    cost: route.cost,
  };
};


exports.updateRouteStop = async (id, updateData) => {
  const updated = await RouteStop.findByIdAndUpdate(
    id,
    { $set: updateData }, // Only update given fields
    { new: true, runValidators: true }
  );
  if (!updated) throw new Error("Route segment not found");
  return updated;
};

exports.deleteRouteStop = async (id) => {
  const deleted = await RouteStop.findByIdAndDelete(id);
  if (!deleted) throw new Error("Route segment not found");
  return deleted;
};
