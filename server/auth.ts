import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getDB, saveDB, addLog } from "./db.js";
import { User, UserRole } from "../src/types.js";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_key_1298401824";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret_key_9824081023";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

// Generate Access Token (1 hour)
export function generateAccessToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: "1h" });
}

// Generate Refresh Token (7 days)
export function generateRefreshToken(user: User): string {
  const payload = { userId: user.id };
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

// Verify Access Token
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

// Verify Refresh Token
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
  } catch (err) {
    return null;
  }
}

// Generate 6-digit numeric OTP
export function generateOTP(email: string): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins expiry
  
  const db = getDB();
  db.otps[email] = { otp, expiresAt };
  saveDB();

  console.log(`[OTP EMAIL SIMULATOR] Gửi mã OTP đến ${email}: ${otp}`);
  return otp;
}

// Verify OTP
export function verifyOTP(email: string, otpInput: string): boolean {
  const db = getDB();
  const record = db.otps[email];
  
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    delete db.otps[email];
    saveDB();
    return false;
  }

  if (record.otp === otpInput) {
    delete db.otps[email];
    saveDB();
    return true;
  }

  return false;
}
