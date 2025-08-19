const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    ride_id: {
       type: mongoose.Schema.Types.ObjectId, 
       ref: 'Ride', 
       required: true, 
       index: true 
      },
    sender_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    sender_role: { 
      type: String, enum: ['driver', 'rider', 'system'], 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    }
  },
  { 
    timestamps: { 
    type: Date, default: Date.now
  } 
}
);

// Helpful compound index for pagination
chatMessageSchema.index({ ride_id: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
