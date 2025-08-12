// riderDetails.model.js

const mongoose = require('mongoose');

const rideRequestSchema = new mongoose.Schema({
  ride_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ride",
    required: true,
  },
  rider_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  from_stop: {
    type: String,
     required: true 
  },
  to_stop: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected","Cancelled","CompletedByRider"],
    default: "Pending",
  },
  requested_at: {
    type: Date,
    default: Date.now,
  },
  is_seen: { 
    type: Boolean,
     default: false 
  },
});

module.exports = mongoose.model("RideRequest", rideRequestSchema);
