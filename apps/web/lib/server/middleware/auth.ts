import { cookies } from "next/headers";
import { verifyToken } from "../jwt";
import { prisma } from "../prisma";

export type AuthUser = {
  id: string;
  role: string;
  canDelete: boolean;
};

/**
 * Get authenticated user from cookie
 * Returns null if not authenticated
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("family_finance_token")?.value;
    
    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      role: user.role,
      canDelete: user.canDelete
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

/**
 * Require authentication - throws error if not authenticated
 * Use in API routes to ensure user is authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthenticated");
  }
  return user;
}

/**
 * Require specific role(s)
 */
export async function requireRole(roles: Array<"ADMIN" | "MEMBER" | "VIEW_ONLY">): Promise<AuthUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role as "ADMIN" | "MEMBER" | "VIEW_ONLY")) {
    throw new Error("Insufficient permissions");
  }
  return user;
}

