import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = "7d";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export type JwtPayload = {
  userId: string;
};

export function signToken(payload: JwtPayload) {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret);
  
  // Type guard to ensure it's an object with userId
  if (typeof decoded === "object" && decoded !== null && "userId" in decoded) {
    return decoded as JwtPayload;
  }
  
  throw new Error("Invalid token");
}

