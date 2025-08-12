const express = require("express");
const router = express.Router();
const { authMiddleware,isAdmin } = require("../../middlewares/auth");
const { create ,getAll,getById,getEndStops,getRouteBetweenStops,updateRouteStop, deleteRouteStop,getStartStops} = require("./route.controller");

router.post("/",create);
router.get("/", getAll);
router.get("/start-stops",getStartStops)
router.get('/end-stops', getEndStops);
router.get('/route', getRouteBetweenStops);
router.get("/:id", getById);
router.put('/:id', updateRouteStop);
router.delete('/:id',deleteRouteStop)

module.exports=router;