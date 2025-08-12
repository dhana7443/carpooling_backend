const notificationService=require("./notification.service");

const testNotifyDriver = async (req, res) => {
  try {
    const { driverId, rideDetails } = req.body;
    await notificationService.notifyDriverOnRequest(driverId, rideDetails);
    res.status(200).json({ message: 'Notification sent to driver.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const testNotifyRider = async (req, res) => {
  try {
    const { riderId, status } = req.body;
    await notificationService.notifyRiderOnStatusChange(riderId, status);
    res.status(200).json({ message: 'Notification sent to rider.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  testNotifyDriver,
  testNotifyRider,
};