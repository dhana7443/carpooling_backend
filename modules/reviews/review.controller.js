const reviewService = require('./review.service');

exports.addReview = async (req, res) => {
  try {
    const { rideId, revieweeId, rating, comment } = req.body;
    const reviewerId = req.user._id; // assuming auth middleware sets req.user

    const review = await reviewService.createReview({
      rideId,
      reviewerId,
      revieweeId,
      rating,
      comment
    });

    res.status(201).json({ message: 'Review added successfully', review });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

exports.getDriverReviews = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const reviews = await reviewService.getReviewsByDriver(driverId);
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDriverAverageRating = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const data = await reviewService.getAverageRatingForDriver(driverId);
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
