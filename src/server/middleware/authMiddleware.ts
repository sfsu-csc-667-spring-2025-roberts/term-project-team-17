// src/server/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = "sheme-key-1000";

// Middleware to block unauthorized access (401)
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach decoded user data to req.user
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    return res.status(400).json({ message: "Invalid token" });
  }
}

// Middleware to attach user data to req.user from the JWT
export function attachUserFromToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  console.log("Attempting to attach user from token...");
  console.log("Token:", token);

  // If there's no token, continue with `req.user` as null or "guest"
  if (!token) {
    console.log("No token provided, proceeding as guest");
    req.user = null; // or req.username = 'Guest';
    return next(); // Proceed to the next middleware or route handler
  }

  try {
    console.log("Token provided, verifying...");
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach the decoded JWT (user data) to req.user
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error("Invalid token, proceeding as guest", err);
    req.user = null; // or req.username = 'Guest'; (if you want to treat invalid tokens as guests)
    next(); // Proceed without blocking the request
  }
}
