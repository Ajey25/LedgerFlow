import express from "express";

import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from "../controllers/invoiceController.js";

const router = express.Router();

// Create invoice
router.post("/", createInvoice);

// Get all invoices
router.get("/", getInvoices);

// Get one invoice
router.get("/:id", getInvoiceById);

// Update invoice
router.put("/:id", updateInvoice);

// Delete invoice
router.delete("/:id", deleteInvoice);

export default router;
