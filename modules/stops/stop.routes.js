const express = require("express");
const router = express.Router();
const {createStop,getAllStops,getStopById,updateStop,deleteStop, getStartLocations, getOriginStops,getDestinationsByOrigin}= require("./stop.controller");
const {isAdmin,onlyDriver}=require("../../middlewares/auth")


router.post("/", createStop);
router.get("/",getAllStops);
router.get("/start-locations",getStartLocations);
router.get("/origin-stops",getOriginStops);
router.get("/destination-stops",getDestinationsByOrigin)
router.get("/:id",getStopById);
router.patch("/:id",updateStop);
router.delete("/:id",deleteStop);


module.exports = router;

