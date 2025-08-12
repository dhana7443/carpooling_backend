const express = require('express');
const router = express.Router();

const {addMoney,sendMoney, getBalance}=require('./wallet.controller');
const {authMiddleware}=require('../../middlewares/auth')

router.post('/add-money',authMiddleware,addMoney);
router.post('/send-money',authMiddleware,sendMoney);
router.get('/balance',authMiddleware,getBalance);

module.exports=router;