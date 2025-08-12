const routeService = require('./route.service');


exports.create = async (req, res) => {
    try {
      const newRouteStop = await routeService.createRouteStopByNames(req.body);
      res.status(201).json(newRouteStop);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };
  

exports.getAll = async (req, res) => {
  try {
    const routes = await routeService.getAllRoutes();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getById = async (req, res) => {
  try {
    const route = await routeService.getRouteById(req.params.id);

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    const formatted = {
      start_stop: route.start_stop_id.stop_name,
      end_stop: route.end_stop_id.stop_name,
      distance: route.distance,
      time: route.time,
      cost: route.cost
    };

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStartStops=async(req,res)=>{
  try{
    const startStops=await routeService.getStartStops();
    res.json(startStops);
    console.log(startStops)
  }
  catch(err){
    res.status(500).json({ message: err.message });
  }
}

exports.getEndStops = async (req, res) => {
  try {
    const startStopName = req.query.startStopName;
    if (!startStopName) {
      return res.status(400).json({ message: "startStopName query parameter is required." });
    }

    const endStops = await routeService.getEndStops(startStopName);
    console.log(endStops)
    res.status(200).json(endStops);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};


exports.getRouteBetweenStops = async (req, res) => {
  try {
    const { startStopName, endStopName } = req.query;

    if (!startStopName || !endStopName) {
      return res.status(400).json({ message: "Both startStopName and endStopName query parameters are required." });
    }

    const route = await routeService.getRouteBetweenStops(startStopName, endStopName);
    res.status(200).json(route);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};


exports.updateRouteStop = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedRoute = await routeService.updateRouteStop(id, updateData);
    res.status(200).json({ message: "Route segment updated successfully", data: updatedRoute });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRouteStop = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await routeService.deleteRouteStop(id);
    res.status(200).json({ message: "Route segment deleted successfully", data: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
