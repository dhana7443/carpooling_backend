const Review = require('./review.model');
const Ride = require('../rides/ride.model');


exports.createReview = async ({ rideId, reviewerId, revieweeId, rating, comment }) => {
  // Check if ride exists
  const ride = await Ride.findById(rideId);
  if (!ride) throw new Error('Ride not found');

  // Create new review
  const review = new Review({
    ride_id: rideId,
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    rating,
    comment
  });

  await review.save();
  return review;
};

exports.getReviewsByDriver = async (driverId) => {
  return Review.find({ reviewee_id: driverId }).populate('reviewer_id', 'name email');
};

exports.getAverageRatingForDriver = async (driverId) => {
  const result = await Review.aggregate([
    { $match: { reviewee_id: new mongoose.Types.ObjectId(driverId) } },
    { $group: { _id: '$reviewee_id', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
  ]);

  if (result.length === 0) return { avgRating: 0, totalReviews: 0 };
  return { avgRating: result[0].avgRating, totalReviews: result[0].totalReviews };
};
