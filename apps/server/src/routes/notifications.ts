import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

const notificationSchema = z.object({
  message: z.string().min(4),
  recipientIds: z.array(z.string()).optional()
});

router.get("/", requireAuth, async (_req, res) => {
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

  return res.json({ notifications: payload });
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = notificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid notification data" });
  }
  if (req.user?.role === "VIEW_ONLY") {
    return res.status(403).json({ message: "View-only members cannot send notifications" });
  }

  const { message, recipientIds } = parsed.data;

  const recipients =
    recipientIds && recipientIds.length > 0
      ? recipientIds
      : (
          await prisma.user.findMany({
            where: { id: { not: req.user!.id } },
            select: { id: true }
          })
        ).map((user) => user.id);

  const notification = await prisma.notification.create({
    data: {
      message,
      sender: {
        connect: { id: req.user!.id }
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

  return res.status(201).json({
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
  });
});

export default router;

