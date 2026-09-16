import mongoose from "mongoose";

const consigneeSnapshotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    gstin: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const invoiceItemSchema = new mongoose.Schema(
  {
    desc: {
      type: String,
      required: true,
      trim: true,
    },

    hsn: {
      type: String,
      required: true,
      trim: true,
    },

    qty: {
      type: Number,
      required: true,
      min: 0,
    },

    rate: {
      type: Number,
      required: true,
      min: 0,
    },

    per: {
      type: String,
      required: true,
      trim: true,
    },

    amt: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const taxSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
    },

    percentage: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceName: {
      type: String,
      trim: true,
      default: "",
    },

    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    invoiceDate: {
      type: Date,
      required: true,
    },

    // Actual Company document ID
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // Historical snapshot
    consignee: {
      type: consigneeSnapshotSchema,
      required: true,
    },

    // Historical snapshot
    buyer: {
      type: consigneeSnapshotSchema,
      required: true,
    },

    items: {
      type: [invoiceItemSchema],
      required: true,

      validate: {
        validator: (items) => items.length > 0,
        message: "Invoice must contain at least one item",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    taxRows: {
      type: [taxSchema],
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID"],
      default: "UNPAID",
    },
  },

  {
    timestamps: true,
  },
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
