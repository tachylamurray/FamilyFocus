import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { requireAuth } from "@/lib/server/middleware/auth";

// Mark route as dynamic (uses cookies)
export const dynamic = 'force-dynamic';

const notificationSchema = z.object({
  message: z.string().min(4),
  recipientIds: z.array(z.string()).optional()
});

export async function GET() {
  try {
    await requireAuth();
    
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        sender: true,
        recipients: {
          include: { user: true }
        }
      }
    });

    const payload = notifications.map((notification) => ({
      id: notification.id,
      message: notification.message,
      createdAt: notification.createdAt,
      sender: {
        id: notification.sender.id,
        name: notification.sender.name,
        email: notification.sender.email,
        relationship: notification.sender.relationship,
        role: notification.sender.role
      },
      recipientIds: notification.recipients.map((recipient) => recipient.userId)
    }));

    return NextResponse.json({ notifications: payload });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    
    if (user.role === "VIEW_ONLY") {
      return NextResponse.json(
        { message: "View-only members cannot send notifications" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = notificationSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid notification data" },
        { status: 400 }
      );
    }

    const { message, recipientIds } = parsed.data;

    const recipients =
      recipientIds && recipientIds.length > 0
        ? recipientIds
        : (
            await prisma.user.findMany({
              where: { id: { not: user.id } },
              select: { id: true }
            })
          ).map((u) => u.id);

    const notification = await prisma.notification.create({
      data: {
        message,
        sender: {
          connect: { id: user.id }
        },
        recipients: {
          create: recipients.map((id) => ({
            user: {
              connect: { id }
            }
          }))
        }
      },
      include: {
        sender: true,
        recipients: true
      }
    });

    return NextResponse.json(
      {
        notification: {
          id: notification.id,
          message: notification.message,
          createdAt: notification.createdAt,
          sender: {
            id: notification.senderId,
            name: notification.sender.name,
            email: notification.sender.email,
            relationship: notification.sender.relationship,
            role: notification.sender.role
          },
          recipientIds: notification.recipients.map((recipient) => recipient.userId)
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Create notification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

