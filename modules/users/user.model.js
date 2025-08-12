const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim:true
    },
    profile_picture: {
      type: Buffer, // or String if using URLs
    },
    phone: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    password: {
      type: String,
      required: true,
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    is_verified: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending",
    },
    // OTP-related
    email_otp: {
      type: String,
      select: false,
    },
    otp_expiry: {
      type: Date,
      select: false,
    },
    //  Driver-only fields (no longer conditionally required here)
    experience: {
      type: Number,
    },
    license_number: {
      type: String,
    },
    vehicle_number: {
      type: String,
    },
    reset_otp:{
      type:String,
      select:false
    },
    reset_otp_expiry:{
      type:Date,
      select:false
    },
    fcmToken:{
      type:String
    },
    is_deleted: {
      type: Boolean,
      default: false
    }

  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next(); // Skip if password not modified (e.g. on update)
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("User", userSchema);
