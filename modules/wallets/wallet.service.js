const Wallet=require('./wallet.model');
const Payment=require('../payments/payment.model');

//create wallet for new user
async function createWallet(user_id) {
  const wallet = new Wallet({
    user_id,
    balance: 0,
    currency: 'INR'
  });
  await wallet.save();
  return wallet;
}

//add money to wallet
const addMoneyToWallet = async (userId, amount) => {
    if (amount <= 0) throw new Error('Amount must be positive');
    const wallet = await Wallet.findOneAndUpdate(
        { user_id: userId },
        { $inc: { balance: amount } },
        { new: true }
    );
    if (!wallet) throw new Error('Wallet not found');
    return wallet;
};

//send money from wallet
const sendMoneyToDriver = async ({ riderId, driverId, rideId, amount }) => {
  const riderWallet = await Wallet.findOne({ user_id: riderId });
  const driverWallet = await Wallet.findOne({ user_id: driverId });

  if (!riderWallet || !driverWallet) {
    throw new Error('Wallet not found for one of the users');
  }

  if (riderWallet.balance < amount) {
    throw new Error('Insufficient balance');
  }

  // Deduct from rider
  riderWallet.balance -= amount;
  await riderWallet.save();

  // Credit to driver
  driverWallet.balance += amount;
  await driverWallet.save();

  // Optional: Store the transaction
  await Payment.create({
    rider_id: riderId,
    driver_id: driverId,
    ride_id: rideId,
    amount,
    status:'Completed',
    timestamp: new Date(),
  });

  return {
    riderWallet: {
      user_id: riderId,
      balance: riderWallet.balance,
    },
    driverWallet: {
      user_id: driverId,
      balance: driverWallet.balance,
    },
  };
}

//get balance
const getWalletBalance = async (userId) => {
    console.log(userId);
    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) throw new Error('Wallet not found');
    return wallet.balance;
};

module.exports = {
  createWallet,
  addMoneyToWallet,
  getWalletBalance,
  sendMoneyToDriver
};
