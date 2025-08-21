const express = require('express');
const router = express.Router();
const { getDriverReviews, getDriverAverageRating } = require('./review.controller');
const auth = require('../middleware/auth'); // assuming you have auth middleware

// Rider adds a review
router.post('/', auth, reviewController.addReview);

// Get all reviews for a driver
router.get('/driver/:driverId', getDriverReviews);

// Get average rating for a driver
router.get('/driver/:driverId/average', getDriverAverageRating);

module.exports = router;
