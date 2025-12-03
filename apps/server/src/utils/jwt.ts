import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

// Type assertion after the check to satisfy TypeScript
const SECRET: string = JWT_SECRET;

export type JwtPayload = {
  userId: string;
};

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, SECRET);
  
  // Type guard to ensure it's an object with userId
  if (typeof decoded === "object" && decoded !== null && "userId" in decoded) {
    return decoded as JwtPayload;
  }
  
  throw new Error("Invalid token");
}

