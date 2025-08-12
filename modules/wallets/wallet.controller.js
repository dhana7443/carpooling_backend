const walletService=require('./wallet.service');
const RideRequest=require('../rideRequests/rideRequest.model');
const Ride=require('../rides/ride.model');

const addMoney = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.user_id;
        const wallet = await walletService.addMoneyToWallet(userId, amount);
        res.status(200).json({ message: 'Money added successfully', wallet });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const sendMoney = async (req, res) => {
  try {
    const { requestId, amount } = req.body;
    const riderId = req.user.user_id;

    // Fetch ride request
    const rideRequest = await RideRequest.findById(requestId);
    if (!rideRequest) {
      return res.status(404).json({ message: 'Ride request not found' });
    }

    // Fetch ride
    const ride = await Ride.findById(rideRequest.ride_id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const driverId = ride.driver_id;
    const rideId = ride._id;

    const result = await walletService.sendMoneyToDriver({
      riderId,
      driverId,
      rideId,
      amount,
    });

    res.status(200).json({ message: 'Payment successful', result });
  } catch (err) {
    console.error('Send money error:', err);
    res.status(400).json({ message: err.message });
  }
};


const getBalance = async (req, res) => {
    try {
        const userId = req.user.user_id;
        console.log(userId);
        const balance = await walletService.getWalletBalance(userId);
        res.status(200).json({ balance });
        console.log(balance);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
module.exports={
    addMoney,
    sendMoney,
    getBalance
};