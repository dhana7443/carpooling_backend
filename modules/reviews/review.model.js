const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  ride_id: {
    type: Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  reviewer_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee_id: { 
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Optional: to prevent duplicate reviews by the same reviewer for the same ride
reviewSchema.index({ ride_id: 1, reviewer_id: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
