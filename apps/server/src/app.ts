import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import authRoutes from "./routes/auth";
import expenseRoutes from "./routes/expenses";
import notificationRoutes from "./routes/notifications";
import memberRoutes from "./routes/members";
import dashboardRoutes from "./routes/dashboard";
import incomeRoutes from "./routes/incomes";
import recurringBillsRoutes from "./routes/recurringBills";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_APP_URL ?? "http://localhost:3000",
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (_req, res) => {
  res.json({
    message: "Family Finance API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      expenses: "/api/expenses",
      notifications: "/api/notifications",
      members: "/api/members",
      dashboard: "/api/dashboard",
      incomes: "/api/incomes"
    }
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/incomes", incomeRoutes);
app.use("/api/recurring-bills", recurringBillsRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
);

export default app;

