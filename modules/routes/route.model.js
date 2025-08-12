// modules/routes/route.model.js

const mongoose = require("mongoose");

const routeStopSchema = new mongoose.Schema(
  {
    route_id: {
      type: String, 
      required: true,
      index: true
    },
    start_stop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stop", 
      required: true,
    },
    end_stop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stop",
      required: true,
    },
    distance: {
      type: Number, 
      required: true,
    },
    time: {
      type: Number, 
      required: true,
    },
    cost: {
      type: Number, 
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

routeStopSchema.index({ start_stop_id: 1, end_stop_id: 1 }, { unique: true });

module.exports = mongoose.model("Route", routeStopSchema);
