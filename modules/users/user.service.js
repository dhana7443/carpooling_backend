const User = require("./user.model");
const Role = require("../roles/role.model");
const { generateOTP } = require("../../utils/otp");
const { sendEmail } = require("../../utils/sendEmail");
const { generateToken, verifyToken } = require("../../utils/generateToken");
const walletService=require('../wallets/wallet.service');
const bcrypt = require("bcryptjs");



exports.registerUser = async (userData) => {
  const {
    name,
    email,
    password,
    phone,
    gender,
    role_name,
    experience,
    license_number,
    vehicle_number,
  } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Fetch role document to check role name
  const role = await Role.findOne({ name: role_name });
  if (!role) {
    throw new Error("Invalid role_name");
  }

  // Generate OTP and expiry (10 minutes)
  const otp = generateOTP();
  const otpExpiry = Date.now() + 2 * 60 * 1000;

  // Prepare new user object
  const newUser = new User({
    name,
    email,
    password,
    phone,
    gender,
    role_id: role._id,
    email_otp: otp,
    otp_expiry: otpExpiry,
  });

  // If role is driver, require driver-specific fields
  if (role.name === "driver") {
    if (
      experience === undefined ||
      !license_number ||
      !vehicle_number
    ) {
      throw new Error(
        "Driver registration requires experience, license number, and vehicle number"
      );
    }

    newUser.experience = experience;
    newUser.license_number = license_number;
    newUser.vehicle_number = vehicle_number;
  } else {
    // Prevent other roles from sending driver-only fields
    if (experience || license_number || vehicle_number) {
      throw new Error(`${role.name} cannot provide driver-specific fields`);
    }
  }

  // Save and send OTP
  await newUser.save();
  await sendEmail(email, "Verify your Email", `Your OTP is: ${otp}`);

  return newUser;
};


//VerifyEmailOtp
exports.verifyEmailOtp = async ({ email, otp }) => {
  const user = await User.findOne({ email }).select("+email_otp +otp_expiry").populate("role_id");
  if (!user) {
    throw new Error("User not found");
  }

  if (user.is_verified === "verified") {
    throw new Error("User is already verified");
  }

  if (!user.email_otp || !user.otp_expiry) {
    throw new Error("OTP not generated or already verified. Please request a new OTP.");
  }

  if (user.otp_expiry < Date.now()) {
    throw new Error("OTP expired. Please request a new OTP.");
  }

  if (user.email_otp !== otp) {
    throw new Error("Invalid OTP");
  }

  // Mark as verified
  user.is_verified = "verified";
  user.email_otp = undefined;
  user.otp_expiry = undefined;
  await walletService.createWallet(user._id);
  await user.save();

  const token = generateToken({
    user_id: user._id,
    role_name: user.role_id.name,
  });

  return { token, user };
};


//Resend Otp
exports.resendEmailOtp = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.is_verified === "verified") {
    throw new Error("User is already verified");
  }

  // Generate new OTP and expiry
  const otp = generateOTP();
  const otpExpiry = Date.now() + 2 * 60 * 1000;

  user.email_otp = otp;
  user.otp_expiry = otpExpiry;
  await user.save();

  await sendEmail(email, "Resend OTP", `Your new OTP is: ${otp}`);

  return { message: "OTP resent successfully" };
};

//Login

exports.loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.trim().toLowerCase() })
    .select("+password") // password is likely select: false
    .populate("role_id","name")
    console.log(user);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.is_verified !== "verified") {
    throw new Error("User is not verified");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({
    user_id: user._id,
    role_name: user.role_id.name,
  });
  console.log(token);
  console.log(user.role_id.name);
  
  // Optionally remove password before sending
  user.password = undefined;

  return {token,user}

  };


// Forgot Password - Send OTP

exports.sendPasswordResetOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user || user.is_verified !== "verified") {
    throw new Error("No verified user found with this email");
  }

  const otp = generateOTP();
  user.reset_otp = otp;
  user.reset_otp_expiry = Date.now() + 2 * 60 * 1000; // 10 minutes
  await user.save();

  await sendEmail(user.email, "Password Reset OTP", `Your OTP is: ${otp}`);
  return { message: "OTP sent to your email" };
};

exports.resendPasswordResetOtp = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate new OTP and expiry
  const otp = generateOTP();
  const otpExpiry = Date.now() + 2 * 60 * 1000;

  user.reset_otp = otp;
  user.reset_otp_expiry = otpExpiry;
  await user.save();

  await sendEmail(email, "Resend OTP", `Your new OTP for forgot password is: ${otp}`);

  return { message: "OTP resent successfully" };
};


// Verify Password Reset OTP

exports.verifyResetOtp = async ({ email, otp }) => {
  const user = await User.findOne({ email }).select("+reset_otp +reset_otp_expiry");

  if (!user) throw new Error("User not found");
  if (!user.reset_otp || !user.reset_otp_expiry) throw new Error("OTP not generated");
  if (user.reset_otp_expiry < Date.now()) throw new Error("OTP expired. Tap on Resend OTP.");
  if (user.reset_otp !== otp) throw new Error("Invalid OTP");

  // Clear OTP fields
  user.reset_otp = undefined;
  user.reset_otp_expiry = undefined;
  await user.save();

  // Create short-lived reset token
  const resetToken = generateToken({user_id:user._id,type:"reset"},"10m")

  return { resetToken };
};


// Reset Password

exports.resetPassword = async ({ token, newPassword }) => {
  try {
    const decoded = verifyToken(token);

    if (decoded.type !== "reset") throw new Error("Invalid token");

    const user = await User.findById(decoded.user_id);
    if (!user) throw new Error("User not found");

    user.password = newPassword;
    await user.save();

    return { message: "Password updated successfully" };
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

//getProfile

exports.getUserProfile = async (userId, roleName) => {
  const user = await User.findById(userId).populate("role_id");

  if (!user) {
    throw new Error("User not found");
  }

  const { name, email, phone, gender, experience, license_number, vehicle_number } = user;

  const response = {
    name,
    email,
    phone,
    gender,
    role: roleName,
  };

  if (roleName === "driver") {
    response.experience = experience;
    response.license_number = license_number;
    response.vehicle_number = vehicle_number;
  }

  return response;
};

//update profile
exports.updateUserProfile = async (userId, roleName, updateData) => {
  const allowedFields = ["name","email","phone","gender"];
  if (roleName === "driver") {
    allowedFields.push("experience", "license_number", "vehicle_number");
  }

  const updatePayload = {};
  for (let field of allowedFields) {
    if (updateData[field] !== undefined) {
      updatePayload[field] = updateData[field];
    }
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updatePayload, {
    new: true,
    runValidators: true,
  }).populate("role_id");

  if (!updatedUser) {
    throw new Error("User not found");
  }

  const { name, email, phone, gender, experience, license_number, vehicle_number } = updatedUser;

  const response = {
    name,
    email,
    phone,
    gender,
    role: updatedUser.role_id.name,
  };

  if (roleName === "driver") {
    response.experience = experience;
    response.license_number = license_number;
    response.vehicle_number = vehicle_number;
  }

  return response;
};



exports.changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  if (currentPassword === newPassword) {
    throw new Error("New password must be different from current password");
  }

  user.password = newPassword; // Will be hashed by pre-save hook
  await user.save();
};

exports.getAllUsers = async () => {
  return User.find({ is_deleted: false }).populate("role_id", "name").select("-password -email_otp -otp_expiry");
};

exports.getUserById = async (userId) => {
  const user = await User.findOne({ _id: userId, is_deleted: false }).populate("role_id", "name").select("-password");
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

exports.softDeleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.is_deleted) {
    throw new Error("User not found or already deleted");
  }

  user.is_deleted = true;
  await user.save();
};

exports.storeFcmTokenService = async (userId, fcmToken) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  user.fcmToken = fcmToken;
  await user.save();
  console.log(user.fcmToken);
  console.log(user);
  return { message: "FCM token saved successfully" };
};