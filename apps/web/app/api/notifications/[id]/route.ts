import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { requireAuth } from "@/lib/server/middleware/auth";

const updateNotificationSchema = z.object({
  message: z.string().min(4)
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const { id } = params;

    const body = await req.json();
    const parsed = updateNotificationSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid notification data", errors: parsed.error.errors },
        { status: 400 }
      );
    }

    const existing = await prisma.notification.findUnique({
      where: { id },
      include: {
        sender: true,
        recipients: {
          include: { user: true }
        }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Notification not found" },
        { status: 404 }
      );
    }

    // Allow any authenticated user to edit
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        message: parsed.data.message
      },
      include: {
        sender: true,
        recipients: {
          include: { user: true }
        }
      }
    });

    return NextResponse.json({
      notification: {
        id: updated.id,
        message: updated.message,
        createdAt: updated.createdAt,
        sender: {
          id: updated.senderId,
          name: updated.sender.name,
          email: updated.sender.email,
          relationship: updated.sender.relationship,
          role: updated.sender.role
        },
        recipientIds: updated.recipients.map((recipient) => recipient.userId)
      }
    });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Update notification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

