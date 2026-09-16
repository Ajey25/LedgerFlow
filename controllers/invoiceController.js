import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";

// *==========================================*
// *CREATE INVOICE*
// *==========================================*

export const createInvoice = async (req, res) => {
  try {
    const {
      invoiceName,
      invoiceNo,
      invoiceDate,
      companyId,
      consignee,
      buyer,
      items,
    } = req.body;

    if (
      !invoiceNo ||
      !invoiceDate ||
      !companyId ||
      !consignee ||
      !buyer ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Required invoice data is missing",
      });
    }

    // Validate Company ID
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid company ID",
      });
    }

    const calculatedItems = items.map((item) => {
      const qty = Number(item.qty);
      const rate = Number(item.rate);

      const amt = +(qty * rate).toFixed(2);

      return {
        desc: item.desc,
        hsn: item.hsn,
        qty,
        rate,
        per: item.per,
        amt,
      };
    });

    const subtotal = +calculatedItems
      .reduce((total, item) => total + item.amt, 0)
      .toFixed(2);

    const cgst = +(subtotal * 0.09).toFixed(2);
    const sgst = +(subtotal * 0.09).toFixed(2);

    const taxRows = [
      {
        label: "CGST",
        percentage: "9%",
        amount: cgst,
      },
      {
        label: "SGST",
        percentage: "9%",
        amount: sgst,
      },
    ];

    const totalAmount = +(subtotal + cgst + sgst).toFixed(2);

    const invoice = await Invoice.create({
      invoiceName,
      invoiceNo,
      invoiceDate,

      // Actual Company MongoDB ID
      companyId,

      // Historical snapshot
      consignee,

      // Historical snapshot
      buyer,

      items: calculatedItems,
      subtotal,
      taxRows,
      totalAmount,
    });

    res.status(201).json({
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Create invoice error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Invoice number already exists",
      });
    }

    res.status(500).json({
      message: "Failed to create invoice",
      error: error.message,
    });
  }
};

// *==========================================*
// *UPDATE INVOICE*
// *==========================================*

export const updateInvoice = async (req, res) => {
  try {
    const {
      invoiceName,
      invoiceNo,
      invoiceDate,
      companyId,
      consignee,
      buyer,
      items,
    } = req.body;

    if (
      !invoiceNo ||
      !invoiceDate ||
      !companyId ||
      !consignee ||
      !buyer ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Required invoice data is missing",
      });
    }

    // Validate Company ID
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid company ID",
      });
    }

    const calculatedItems = items.map((item) => {
      const qty = Number(item.qty);
      const rate = Number(item.rate);

      const amt = +(qty * rate).toFixed(2);

      return {
        desc: item.desc,
        hsn: item.hsn,
        qty,
        rate,
        per: item.per,
        amt,
      };
    });

    const subtotal = +calculatedItems
      .reduce((total, item) => total + item.amt, 0)
      .toFixed(2);

    const cgst = +(subtotal * 0.09).toFixed(2);
    const sgst = +(subtotal * 0.09).toFixed(2);

    const taxRows = [
      {
        label: "CGST",
        percentage: "9%",
        amount: cgst,
      },
      {
        label: "SGST",
        percentage: "9%",
        amount: sgst,
      },
    ];

    const totalAmount = +(subtotal + cgst + sgst).toFixed(2);

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        invoiceName,
        invoiceNo,
        invoiceDate,

        // Actual Company MongoDB ID
        companyId,

        // Historical snapshot
        consignee,

        // Historical snapshot
        buyer,

        items: calculatedItems,
        subtotal,
        taxRows,
        totalAmount,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Update invoice error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Invoice number already exists",
      });
    }

    res.status(500).json({
      message: "Failed to update invoice",
      error: error.message,
    });
  }
};

// *==========================================*
// *GET ALL INVOICES*
// *==========================================*

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .sort({
        invoiceDate: -1,
        createdAt: -1,
      })
      .populate("companyId", "name gstin");

    res.status(200).json({
      message: "Invoices fetched successfully",
      data: invoices,
    });
  } catch (error) {
    console.error("Get invoices error:", error);

    res.status(500).json({
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
};

// *==========================================*
// *GET SINGLE INVOICE*
// *==========================================*

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate(
      "companyId",
      "name gstin",
    );

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      message: "Invoice fetched successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Get invoice error:", error);

    res.status(500).json({
      message: "Failed to fetch invoice",
      error: error.message,
    });
  }
};

// *==========================================*
// *DELETE INVOICE*
// *==========================================*

export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      message: "Invoice deleted successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Delete invoice error:", error);

    res.status(500).json({
      message: "Failed to delete invoice",
      error: error.message,
    });
  }
};
