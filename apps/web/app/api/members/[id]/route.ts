import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireRole } from "@/lib/server/middleware/auth";

// Mark route as dynamic (uses cookies)
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(["ADMIN"]);
    const { id } = params;
    
    // Prevent admins from deleting themselves
    if (id === user.id) {
      return NextResponse.json(
        { message: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthenticated" || error.message === "Insufficient permissions") {
      return NextResponse.json(
        { message: error.message },
        { status: error.message === "Unauthenticated" ? 401 : 403 }
      );
    }
    
    // Handle specific Prisma errors
    if (error?.code === 'P2003') {
      return NextResponse.json(
        { message: "Cannot delete user: user has related data that cannot be removed." },
        { status: 400 }
      );
    }
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    console.error("Delete member error:", error);
    const errorMessage = error?.message || "Failed to delete user. Please try again.";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

