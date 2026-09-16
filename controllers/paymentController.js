import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";

// ===============================
// CREATE PAYMENT / MARK AS PAID
// ===============================
export const createPayment = async (req, res) => {
  try {
    const {
      invoiceId,
      paymentDate,
      amountReceived,
      tdsDeducted = false,
      referenceNumber = "",
      notes = "",
    } = req.body;

    if (!invoiceId || !paymentDate || amountReceived === undefined) {
      return res.status(400).json({
        message: "Invoice ID, payment date and amount received are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    // Find the original invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    // Prevent paying the same invoice twice
    const existingPayment = await Payment.findOne({ invoiceId });
    if (existingPayment) {
      return res.status(409).json({
        message: "This invoice has already been marked as paid",
      });
    }

    const received = Number(amountReceived);
    if (!Number.isFinite(received) || received < 0) {
      return res.status(400).json({
        message: "Amount received must be a valid positive number",
      });
    }

    const invoiceAmount = Number(invoice.totalAmount);
    let tdsAmount = 0;
    let tdsRate = 0;

    if (tdsDeducted) {
      if (received > invoiceAmount) {
        return res.status(400).json({
          message:
            "Amount received cannot be greater than invoice amount when TDS is deducted",
        });
      }

      tdsAmount = invoiceAmount - received;
      if (invoiceAmount > 0) {
        tdsRate = (tdsAmount / invoiceAmount) * 100;
      }

      tdsAmount = Number(tdsAmount.toFixed(2));
      tdsRate = Number(tdsRate.toFixed(2));
    } else {
      if (received !== invoiceAmount) {
        return res.status(400).json({
          message:
            "Amount received must equal invoice amount when TDS is not deducted",
        });
      }
    }

    const payment = await Payment.create({
      invoiceId: invoice._id,
      companyId: invoice.companyId,
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate,
      company: {
        name: invoice.consignee.name,
        gstin: invoice.consignee.gstin,
      },
      paymentDate,
      invoiceAmount,
      amountReceived: received,
      tdsDeducted,
      tdsAmount,
      tdsRate,
      status: "PAID",
      referenceNumber,
      notes,
    });

    // Mark the invoice as PAID in the database
    await Invoice.findByIdAndUpdate(invoice._id, {
      paymentStatus: "PAID",
      isPaid: true,
    });

    res.status(201).json({
      message: "Payment recorded successfully",
      payment,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({
      message: "Failed to record payment",
      error: error.message,
    });
  }
};

// ===============================
// GET ALL PAYMENTS
// ===============================
export const getPayments = async (req, res) => {
  try {
    const { companyId } = req.query;

    const filter = {};

    if (companyId) {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          message: "Invalid company ID",
        });
      }

      filter.companyId = companyId;
    }

    const payments = await Payment.find(filter)
      .sort({ paymentDate: -1 })
      .populate("invoiceId", "invoiceNo invoiceDate totalAmount")
      .populate("companyId", "name gstin");

    res.status(200).json(payments);
  } catch (error) {
    console.error("Get payments error:", error);

    res.status(500).json({
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

// ===============================
// GET SINGLE PAYMENT
// ===============================
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(id)
      .populate("invoiceId", "invoiceNo invoiceDate totalAmount")
      .populate("companyId", "name gstin");

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error("Get payment error:", error);

    res.status(500).json({
      message: "Failed to fetch payment",
      error: error.message,
    });
  }
};

// ===============================
// DELETE PAYMENT (RESERVES INVOICE STATUS TO UNPAID)
// ===============================
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findByIdAndDelete(id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    // Update associated invoice status back to UNPAID
    if (payment.invoiceId) {
      await Invoice.findByIdAndUpdate(payment.invoiceId, {
        paymentStatus: "UNPAID",
        isPaid: false,
      });
    }

    res.status(200).json({
      message: "Payment deleted and invoice marked as unpaid",
    });
  } catch (error) {
    console.error("Delete payment error:", error);

    res.status(500).json({
      message: "Failed to delete payment",
      error: error.message,
    });
  }
};
