import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Restricts a route to specific roles within the admin scope.
export function requireAdminRole(...allowedRoles) {
  return (req, res, next) => {
    if (req.user?.scope !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient role" });
    }
    next();
  };
}

// Restricts a route to authenticated client users, and scopes queries to their own customer_id.
export function requireClient(req, res, next) {
  if (req.user?.scope !== "client") {
    return res.status(403).json({ error: "Client access required" });
  }
  next();
}
