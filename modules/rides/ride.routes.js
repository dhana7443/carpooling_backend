const express = require("express");
const router = express.Router();
const {createRide,searchRides, getMyRides,updateRide, cancelRide,getRideDetails, getSegmentOccupancy, validateRideRequest, getRiderPreviousRides, completeRide, startRide, getRideInfo} = require("./ride.controller");
const {authMiddleware,onlyDriver, onlyRider}=require("../../middlewares/auth");


router.post("/",authMiddleware,onlyDriver, createRide);
router.get("/search-rides",searchRides);
router.get("/my-rides",authMiddleware,getMyRides);
router.get('/ride/:ride_id', authMiddleware,onlyDriver, getRideDetails);
router.put("/ride/:id",authMiddleware,onlyDriver,updateRide)
router.put("/cancel/:ride_id", authMiddleware, onlyDriver, cancelRide);
router.get('/segment-occupancy/:ride_id/:route_id',getSegmentOccupancy);
router.post('/validate-request',validateRideRequest);
router.get('/rider-rides',authMiddleware,onlyRider,getRiderPreviousRides);
router.put('/complete/:ride_id',authMiddleware,completeRide);
router.post('/:rideId/start',authMiddleware,startRide);
router.get('/:rideId/info',authMiddleware,getRideInfo);


module.exports = router;
