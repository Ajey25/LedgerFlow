import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import MonthlyExpense from "../models/MonthlyExpense.js";

export const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const m = Number(month);
    const y = Number(year);

    // 1. UTC Date Boundaries for the Target Month
    const startOfMonth = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(y, m, 1, 0, 0, 0));

    // 2. Fetch Invoices created in that month
    const invoices = await Invoice.find({
      invoiceDate: { $gte: startOfMonth, $lt: endOfMonth },
    }).lean();

    const invoiceIds = invoices.map((inv) => inv._id);

    // 3. Fetch Payments associated with those Invoices
    const payments = await Payment.find({
      invoiceId: { $in: invoiceIds },
    }).lean();

    const paymentMap = new Map(
      payments.map((p) => [p.invoiceId.toString(), p]),
    );

    // 4. Fetch Expenses for that month
    const expenseRecord = await MonthlyExpense.findOne({
      month: m,
      year: y,
    }).lean();
    const totalExpenses = expenseRecord ? expenseRecord.totalExpenses : 0;

    // 5. Aggregate Metrics
    let totalInvoiceAmount = 0;
    let totalAmountReceived = 0;
    let totalTds = 0;
    let paidInvoicesCount = 0;

    const detailedInvoices = invoices.map((inv) => {
      totalInvoiceAmount += inv.totalAmount;
      const payment = paymentMap.get(inv._id.toString());

      if (payment) {
        paidInvoicesCount += 1;
        totalAmountReceived += payment.amountReceived;
        totalTds += payment.tdsAmount;
      }

      return {
        _id: inv._id,
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.invoiceDate,
        totalAmount: inv.totalAmount,
        amountReceived: payment ? payment.amountReceived : 0,
        tdsAmount: payment ? payment.tdsAmount : 0,
        paymentDate: payment ? payment.paymentDate : null,
        status: payment ? "PAID" : "UNPAID",
      };
    });

    const totalInvoices = invoices.length;
    const allInvoicesPaid =
      totalInvoices > 0 && paidInvoicesCount === totalInvoices;

    // Profit logic: Only calculated if ALL invoices are paid
    const profit = allInvoicesPaid ? totalAmountReceived - totalExpenses : null;

    res.status(200).json({
      month: m,
      year: y,
      summary: {
        totalInvoices,
        paidInvoices: paidInvoicesCount,
        unpaidInvoices: totalInvoices - paidInvoicesCount,
        allInvoicesPaid,
        totalInvoiceAmount,
        totalAmountReceived,
        totalTds,
        totalExpenses,
        profit,
      },
      expenses: expenseRecord || null,
      invoices: detailedInvoices,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to generate report", error: error.message });
  }
};
