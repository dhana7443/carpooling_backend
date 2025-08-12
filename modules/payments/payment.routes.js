const express = require('express');
const router = express.Router();
const {getRideCost}=require('./payment.controller');
const {authMiddleware}=require('../../middlewares/auth')

router.get('/ride-cost/:requestId', authMiddleware, getRideCost);

module.exports = router;