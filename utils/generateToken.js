const jwt = require("jsonwebtoken");

exports.generateToken = (payload,expiresIn="1d") => {
  return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn});
};

exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};