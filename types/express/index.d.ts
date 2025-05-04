// src/types/express/index.d.ts
import express, { Request } from "express";

// Extend Express Request interface to include username
declare global {
  namespace Express {
    interface Request {
      user?: any;
      username?: string;
    }
  }
}
