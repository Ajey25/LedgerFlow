import express from "express";
import { getMonthlyReport } from "../controllers/reportController.js";
import {
  getOrUpdateExpense,
  saveExpense,
} from "../controllers/expenseController.js";

const router = express.Router();

router.get("/monthly-report", getMonthlyReport);
router.get("/expenses", getOrUpdateExpense);
router.post("/expenses", saveExpense);

export default router;
