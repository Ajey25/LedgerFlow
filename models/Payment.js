import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      unique: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    invoiceNo: {
      type: String,
      required: true,
      trim: true,
    },

    invoiceDate: {
      type: Date,
      required: true,
    },

    company: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      gstin: {
        type: String,
        required: true,
        trim: true,
      },
    },

    paymentDate: {
      type: Date,
      required: true,
    },

    invoiceAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    amountReceived: {
      type: Number,
      required: true,
      min: 0,
    },

    tdsDeducted: {
      type: Boolean,
      default: false,
    },

    tdsAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    tdsRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["PAID"],
      default: "PAID",
    },

    referenceNumber: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Company-wise ledger queries
paymentSchema.index({
  companyId: 1,
  paymentDate: -1,
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
