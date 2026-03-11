import express from "express";
import { green, red } from "colorette";
import { startMonitoring } from "./utils/monitor";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/users/AuthRoutes";
import clientsRoutes from "./routes/client/ClientRoutes";
import clientPublicRoutes from "./routes/client/ClientPublicRoutes";
import servicesRoutes from "./routes/service/ServicesRoutes";
import MaterialRoutes from "./routes/material/MaterialRoutes";
import BudgetRoutes from "./routes/budget/BudgetRoutes";
import materialBudgetRoutes from "./routes/material/MaterialBudgetRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/public", clientPublicRoutes);

app.use("/auth", authRoutes);

app.use("/clients", clientsRoutes);

app.use("/services", servicesRoutes);

app.use("/materials", MaterialRoutes);

app.use("/budgets", BudgetRoutes);

app.use("/materialBudget", materialBudgetRoutes);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(green(`🚀 Server running on port ${PORT}`));
  startMonitoring();
});
process.on("uncaughtException", (error) => {
  console.error(red("Uncaught Exception:"), error);
});

process.on("unhandledRejection", (error) => {
  console.error(red("Unhandled Rejection:"), error);
});
