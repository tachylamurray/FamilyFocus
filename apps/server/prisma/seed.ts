import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.notificationRecipient.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.income.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const alex = await prisma.user.create({
    data: {
      name: "Alex Johnson",
      email: "alex@example.com",
      relationship: "Power of Attorney",
      role: "ADMIN",
      canDelete: true, // Only this admin can delete expenses
      passwordHash
    }
  });

  const jane = await prisma.user.create({
    data: {
      name: "Jane Doe",
      email: "jane@example.com",
      relationship: "Daughter",
      role: "MEMBER",
      passwordHash
    }
  });

  const michael = await prisma.user.create({
    data: {
      name: "Michael Smith",
      email: "michael@example.com",
      relationship: "Caregiver",
      role: "VIEW_ONLY",
      passwordHash
    }
  });

  const mortgage = await prisma.expense.create({
    data: {
      category: "Mortgage",
      amount: 1850,
      dueDate: new Date(),
      notes: "Autopay on the 1st",
      createdById: alex.id
    }
  });

  const electricity = await prisma.expense.create({
    data: {
      category: "Electricity",
      amount: 120.45,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      notes: "Includes fall rate change",
      createdById: jane.id
    }
  });

  const therapy = await prisma.expense.create({
    data: {
      category: "Therapy Expenses",
      amount: 85.0,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      notes: "Co-pay for weekly session",
      createdById: jane.id
    }
  });

  await prisma.income.createMany({
    data: [
      {
        source: "Social Security",
        amount: 2100,
        receivedDate: new Date(new Date().setDate(3)),
        createdById: alex.id
      },
      {
        source: "Pension",
        amount: 1450,
        receivedDate: new Date(new Date().setDate(10)),
        createdById: alex.id
      },
      {
        source: "Family Support",
        amount: 950,
        receivedDate: new Date(new Date().setDate(15)),
        createdById: jane.id
      }
    ]
  });

  const notification = await prisma.notification.create({
    data: {
      message: "John Doe’s social security benefits end Monday, Nov 11.",
      senderId: alex.id,
      recipients: {
        create: [
          { userId: jane.id },
          { userId: michael.id }
        ]
      }
    }
  });

  await prisma.notificationRecipient.create({
    data: {
      notificationId: notification.id,
      userId: alex.id
    }
  });

  console.log("Seed data created:");
  console.table([
    { email: alex.email, password: "password123" },
    { email: jane.email, password: "password123" },
    { email: michael.email, password: "password123" }
  ]);

  console.log("Example expense IDs:", {
    mortgage: mortgage.id,
    electricity: electricity.id,
    therapy: therapy.id
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

