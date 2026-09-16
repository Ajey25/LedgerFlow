import mongoose from "mongoose";

const monthlyExpenseSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    purchases: { type: Number, default: 0, min: 0 },
    rent: { type: Number, default: 0, min: 0 },
    electricity: { type: Number, default: 0, min: 0 },
    gstPaid: { type: Number, default: 0, min: 0 },
    salary: { type: Number, default: 0, min: 0 },
    otherExpenses: { type: Number, default: 0, min: 0 },
    totalExpenses: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

// Prevent duplicate expense entries for the same month/year
monthlyExpenseSchema.index({ month: 1, year: 1 }, { unique: true });

// Auto-calculate totalExpenses before saving
// Remove 'next' parameter and call function directly
monthlyExpenseSchema.pre("save", function () {
  this.totalExpenses =
    (this.purchases || 0) +
    (this.rent || 0) +
    (this.electricity || 0) +
    (this.gstPaid || 0) +
    (this.salary || 0) +
    (this.otherExpenses || 0);
});

const MonthlyExpense = mongoose.model("MonthlyExpense", monthlyExpenseSchema);
export default MonthlyExpense;
