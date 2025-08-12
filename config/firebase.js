// // config/firebase.js
// const firebaseAdmin = require('firebase-admin');
// const serviceAccount = require('./firebase-service-account.json');

// firebaseAdmin.initializeApp({
//   credential: firebaseAdmin.credential.cert(serviceAccount),
// });

// module.exports = firebaseAdmin;

const admin = require('firebase-admin');
const path = require('path');

// Path to your service account file
const serviceAccount = require(path.resolve(__dirname, './firebase-service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin initialized");
}

module.exports = admin;
