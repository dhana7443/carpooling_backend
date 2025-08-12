const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One wallet per user
  },
  balance: {
    type: Number,
    default: 0,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);
