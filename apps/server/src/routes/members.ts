import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const members = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      relationship: true,
      role: true,
      canDelete: true
    }
  });
  return res.json({ members });
});

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER", "VIEW_ONLY"])
});

router.put("/:id/role", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  
  // Prevent admins from changing their own role
  if (id === req.user!.id) {
    return res.status(400).json({ message: "Cannot change your own role" });
  }

  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid request", errors: parsed.error.errors });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
    select: {
      id: true,
      name: true,
      email: true,
      relationship: true,
      role: true,
      canDelete: true
    }
  });

  return res.json({ member: updatedUser });
});

router.delete("/:id", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admins from deleting themselves
    if (id === req.user!.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete related data first to handle foreign key constraints
    // Must delete in correct order due to RESTRICT constraints
    await prisma.$transaction(async (tx) => {
      // First, get all notifications sent by this user so we can delete their recipients
      const notificationsSent = await tx.notification.findMany({
        where: { senderId: id },
        select: { id: true }
      });
      const notificationIds = notificationsSent.map(n => n.id);

      // Step 1: Delete notification recipients for notifications sent by this user
      // This must be done first because NotificationRecipient has RESTRICT on notificationId
      if (notificationIds.length > 0) {
        await tx.notificationRecipient.deleteMany({
          where: { notificationId: { in: notificationIds } }
        });
      }

      // Step 2: Delete notification recipients where this user is the recipient
      // This must be done because NotificationRecipient has RESTRICT on userId
      await tx.notificationRecipient.deleteMany({
        where: { userId: id }
      });

      // Step 3: Delete notifications sent by this user
      // This must be done because Notification has RESTRICT on senderId
      await tx.notification.deleteMany({
        where: { senderId: id }
      });

      // Step 4: Delete expense audit logs (changedBy is just a string, not a FK, but clean up anyway)
      await tx.expenseAuditLog.deleteMany({
        where: { changedBy: id }
      });

      // Step 5: Delete the user
      // Expenses and Incomes will have createdById set to NULL automatically (SET NULL constraint)
      await tx.user.delete({
        where: { id }
      });
    }, {
      timeout: 10000 // 10 second timeout
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    
    // Handle specific Prisma errors
    if (error?.code === 'P2003') {
      return res.status(400).json({ message: "Cannot delete user: user has related data that cannot be removed." });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Provide generic error message
    const errorMessage = error?.message || "Failed to delete user. Please try again.";
    return res.status(500).json({ message: errorMessage });
  }
});

export default router;

