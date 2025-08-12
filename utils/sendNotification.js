require("../config/firebase");
const admin=require("firebase-admin");

const sendNotification=async(storeFcmToken,DataTransferItemList,body,data={})=>{
    const message = {
    token: fcmToken,
    notification: { title, body },
    data, // optional payload
  };
  try {
    const response = await admin.messaging().send(message);
    console.log(" Notification sent:", response);
    return response;
  } catch (error) {
    console.error(" Error sending notification:", error);
    throw error;
  }
}

module.exports=sendNotification;