const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema({
    ride_id: { type: Schema.Types.ObjectId, ref: 'Ride', required: true },
    rider_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driver_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
