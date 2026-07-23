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

    const userRole = (req.user.role || "").toLowerCase().trim();
    
    // Normalize role collections:
    const adminRoles = ["admin", "it officer", "it officer/admin", "it officer admin"];
    const oicRoles = ["oic", "oic traffic branch"];
    const officerRoles = ["officer", "traffic officer"];

    let rolesToCheck = [userRole];
    if (adminRoles.includes(userRole)) {
      rolesToCheck = adminRoles;
    } else if (oicRoles.includes(userRole)) {
      rolesToCheck = oicRoles;
    } else if (officerRoles.includes(userRole)) {
      rolesToCheck = officerRoles;
    }

    // Normalize allowed roles as well:
    const normalizedAllowedRoles = allowedRoles.reduce((acc, r) => {
      const lower = r.toLowerCase().trim();
      acc.push(lower);
      if (lower === "officer") acc.push(...officerRoles);
      if (lower === "traffic officer") acc.push(...officerRoles);
      if (lower === "admin") acc.push(...adminRoles);
      if (lower === "it officer") acc.push(...adminRoles);
      if (lower === "oic") acc.push(...oicRoles);
      return acc;
    }, []);

    const hasRole = rolesToCheck.some(r => normalizedAllowedRoles.includes(r));

    console.log(`[AUTH DEBUG] User: ${req.user.username}, Role in token: ${req.user.role}, Checked: ${JSON.stringify(rolesToCheck)}, Allowed for route: ${JSON.stringify(allowedRoles)} (Normalized: ${JSON.stringify(normalizedAllowedRoles)}), Has Permission: ${hasRole}`);

    if (!hasRole) {
      return res.status(403).json({ message: "Forbidden. You do not have permission." });
    }

    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
