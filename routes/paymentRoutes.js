import express from "express";

import {
  createPayment,
  getPayments,
  getPaymentById,
  deletePayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/", createPayment);

router.get("/", getPayments);

router.get("/:id", getPaymentById);

router.delete("/:id", deletePayment);

export default router;
