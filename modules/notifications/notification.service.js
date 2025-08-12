// services/notification.service.js
const User = require('../users/user.model'); // assuming users have FCM tokens
const sendNotification = require('../../utils/sendNotification');

const notifyDriverOnRequest = async (driverId, rideDetails) => {
  const driver = await User.findById(driverId);
  if (!driver || !driver.fcmToken) throw new Error('Driver FCM token not found');

  const title = "New Ride Request";
  const body = `You have a new ride request for route ${rideDetails.route_id}`;
  await sendNotification(driver.fcmToken, title, body, {
    type: 'ride_request',
    ride_id: rideDetails._id.toString(),
  });
};

const notifyRiderOnStatusChange = async (riderId, status) => {
  const rider = await User.findById(riderId);
  if (!rider || !rider.fcmToken) throw new Error('Rider FCM token not found');

  const title = `Ride Request ${status}`;
  const body = `Your ride request has been ${status.toLowerCase()}.`;
  await sendNotification(rider.fcmToken, title, body, {
    type: 'request_status',
    status,
  });
};

module.exports = {
  notifyDriverOnRequest,
  notifyRiderOnStatusChange,
};
