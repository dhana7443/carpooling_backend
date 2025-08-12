//notification.routes.js

const express = require('express');
const router = express.Router();
const {testNotifyDriver,testNotifyRider}=require("./notification.controller");

// For testing notifications manually
router.post('/driver', testNotifyDriver);
router.post('/rider', testNotifyRider);

module.exports = router;