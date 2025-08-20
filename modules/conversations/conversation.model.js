const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    ride_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Ride", 
      required: true, 
      index: true 
    },
    driver_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    rider_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    lastMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ ride_id: 1, driver_id: 1, rider_id: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
