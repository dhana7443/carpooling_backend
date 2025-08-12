// user.controller.js

const userService = require('./user.service');

exports.registerUser = async (req, res) => {
  try {
    console.log(req.body)
    const userData = req.body; // <-- request body extracted here
    const user = await userService.registerUser(userData);
    console.log(user)
    res.status(201).json({ message: 'User registered successfully. Please verify your email.', user_id: user.user_id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const {token,user} = await userService.verifyEmailOtp({email, otp});

    res.status(200).json({
      message: 'Email verified successfully',
      //dashboard
      token: token,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        role: user.role_id.name
      },
    });
    console.log(token)
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const result = await userService.resendEmailOtp(req.body.email);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const {token,user} = await userService.loginUser({ email, password });
    console.log({token,user});
    res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        user_id:user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        role: user.role_id.name
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.passwordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await userService.sendPasswordResetOtp(email);
    console.log(result);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.resendPasswordResetOtp = async (req, res) => {
  try {
    const result = await userService.resendPasswordResetOtp(req.body.email);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
    console.log
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await userService.verifyResetOtp({ email, otp });
    console.log(result);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
    
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const result = await userService.resetPassword({ token, newPassword });
    console.log(result);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.user.user_id, req.user.role_name);

    res.status(200).json({
      message: "User profile fetched successfully",
      user,
    });
    console.log({user});
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const updatedUser = await userService.updateUserProfile(req.user.user_id, req.user.role_name, req.body);
    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
    console.log({user});
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    await userService.changePassword(req.user.user_id, currentPassword, newPassword);
    console.log("hello");
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.softDeleteUser = async (req, res) => {
  try {
    await userService.softDeleteUser(req.params.id);
    res.status(200).json({ message: "User soft deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.storeFcmToken = async (req, res) => {
  try {
    const userId = req.user.user_id; // from auth middleware
    const { fcmToken } = req.body;
    console.log(userId);
    console.log(fcmToken);
    if (!fcmToken) {
      return res.status(400).json({ error: "FCM token is required" });
    }

    const result = await userService.storeFcmTokenService(userId, fcmToken);
    console.log(result);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error storing FCM token:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};