import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import companyRoutes from "./routes/companyRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import path from "path";
import { fileURLToPath } from "node:url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, "dist")));

// Connect MongoDB
connectDB();

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Bill App Backend is running",
  });
});

//all Routes
app.use("/api/companies", companyRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get(/.*/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "dist", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
