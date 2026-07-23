const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log("[AUTH] No req.user found in authorizeRoles.");
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    const userRole = req.user.role; // e.g. "admin", "oic", "officer"
    
    // Map database role values to their potential display equivalents to be flexible
    const displayRoleMap = {
      "admin": ["admin", "IT Officer", "IT Officer/Admin", "IT Officer Admin"],
      "oic": ["oic", "OIC", "OIC Traffic Branch"],
      "officer": ["officer", "Traffic Officer", "officer"]
    };

    const rolesToCheck = displayRoleMap[userRole] || [userRole];

    const hasRole = allowedRoles.some(role => 
      rolesToCheck.some(r => r.toLowerCase() === role.toLowerCase())
    );

    console.log(`[AUTH DEBUG] User: ${req.user.username}, Role in token: ${userRole}, Mapped roles: ${JSON.stringify(rolesToCheck)}, Allowed roles for route: ${JSON.stringify(allowedRoles)}, Has Permission: ${hasRole}`);

    if (!hasRole) {
      return res.status(403).json({ message: "Forbidden. You do not have permission." });
    }

    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
