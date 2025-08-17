const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // includes user_id and role_name
    
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
exports.isAdmin = (requiredRole) => {
  return (req, res, next) => {
    const userRole = req.user?.role_name; // assuming req.user is populated from auth middleware

    if (!userRole) {
      return res.status(401).json({ message: "User role not found in request" });
    }

    if (userRole !== requiredRole) {
      return res.status(403).json({ message: `Access denied. ${requiredRole}s only.` });
    }

    next();
  };
};

exports.onlyDriver = (req, res, next) => {
  if (req.user?.role_name !== "driver") {
    return res.status(403).json({ message: "Only drivers can create rides" });
  }
  console.log("yes");
  next();
};

exports.onlyRider=(req,res,next)=>{
  if (req.user?.role_name !== "rider") {
    return res.status(403).json({ message: "Only riders can book rides" });
  }
  console.log("yes");
  next();

}
