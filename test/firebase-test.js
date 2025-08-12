// test/firebase-test.js
const firebaseAdmin = require("../config/firebase");

firebaseAdmin.messaging().send({
  token: 'e9UgCFeiQHG1X4LPvjty4i:APA91bFOYpTIFWKHCuBvGzdn2h5U4uijAd-YWrhPE01F7OoZqUk30vgnIY16mgMUcyRhhtfYNJqq1-__9j0Glzt-I2I6nxXFjw149IQovY521RIHYinXcRI',
  notification: {
    title: 'Test Notification',
    body: 'Firebase is working!',
  },
})
.then(response => {
  console.log('✅ Notification sent:', response);
})
.catch(error => {
  console.error('❌ Error sending notification:', error);
});
