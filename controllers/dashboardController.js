import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import MonthlyExpense from "../models/MonthlyExpense.js";
import { getFYDateBounds, getMonthDateBounds } from "../utils/financialYear.js";

const MONTH_NAMES = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
];

const FY_MONTH_NUMBERS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

export const getDashboardData = async (req, res) => {
  try {
    const currentCalYear = new Date().getFullYear();
    const currentCalMonth = new Date().getMonth() + 1; // 1-12

    // Default FY calculation (If today is March 2026 -> FY 2025-26; If April 2026 -> FY 2026-27)
    const defaultStartYear =
      currentCalMonth >= 4 ? currentCalYear : currentCalYear - 1;
    const defaultFY = `${defaultStartYear}-${(defaultStartYear + 1).toString().slice(2)}`;

    const financialYearStr = req.query.financialYear || defaultFY;
    const selectedMonthQuery = req.query.month || "all";

    const {
      startDate: fyStart,
      endDate: fyEnd,
      startYear,
    } = getFYDateBounds(financialYearStr);

    // 1. Fetch all Invoices in FY
    const fyInvoices = await Invoice.find({
      invoiceDate: { $gte: fyStart, $lt: fyEnd },
    })
      .sort({ invoiceDate: -1 })
      .lean();

    const fyInvoiceIds = fyInvoices.map((inv) => inv._id);

    // 2. Fetch linked Payments
    const fyPayments = await Payment.find({
      invoiceId: { $in: fyInvoiceIds },
    }).lean();

    const paymentMap = new Map(
      fyPayments.map((p) => [p.invoiceId.toString(), p]),
    );

    // 3. Fetch Monthly Expenses for all 12 months of this FY
    const expenseRecords = await MonthlyExpense.find({
      $or: FY_MONTH_NUMBERS.map((m) => ({
        month: m,
        year: m >= 4 ? startYear : startYear + 1,
      })),
    }).lean();

    const expenseMap = new Map(
      expenseRecords.map((e) => [`${e.year}-${e.month}`, e.totalExpenses || 0]),
    );

    // Filter invoices by month if requested
    let filteredInvoices = fyInvoices;
    if (selectedMonthQuery !== "all") {
      const targetMonth = Number(selectedMonthQuery);
      const { startDate: mStart, endDate: mEnd } = getMonthDateBounds(
        startYear,
        targetMonth,
      );
      filteredInvoices = fyInvoices.filter(
        (inv) =>
          new Date(inv.invoiceDate) >= mStart &&
          new Date(inv.invoiceDate) < mEnd,
      );
    }

    // --- KPI Metrics Calculation ---
    let totalInvoiced = 0;
    let outstandingReceivables = 0;
    let totalTds = 0;
    let totalReceived = 0;
    let unpaidCount = 0;

    filteredInvoices.forEach((inv) => {
      totalInvoiced += inv.totalAmount;
      const payment = paymentMap.get(inv._id.toString());

      if (payment) {
        totalReceived += payment.amountReceived;
        totalTds += payment.tdsAmount;
      } else {
        unpaidCount += 1;
        outstandingReceivables += inv.totalAmount;
      }
    });

    // --- Realized Profit Calculation ---
    let realizedProfit = null;
    let completedProfitMonths = 0;
    let pendingProfitMonths = 0;

    if (selectedMonthQuery !== "all") {
      const m = Number(selectedMonthQuery);
      const yr = m >= 4 ? startYear : startYear + 1;
      const mInvoices = filteredInvoices;
      const mPaidCount = mInvoices.filter((inv) =>
        paymentMap.has(inv._id.toString()),
      ).length;
      const allPaid = mInvoices.length > 0 && mPaidCount === mInvoices.length;

      const mExpenses = expenseMap.get(`${yr}-${m}`) || 0;
      const mReceived = mInvoices.reduce((acc, inv) => {
        const p = paymentMap.get(inv._id.toString());
        return acc + (p ? p.amountReceived : 0);
      }, 0);

      realizedProfit = allPaid ? mReceived - mExpenses : null;
    } else {
      let sumProfit = 0;
      FY_MONTH_NUMBERS.forEach((m) => {
        const yr = m >= 4 ? startYear : startYear + 1;
        const { startDate: mStart, endDate: mEnd } = getMonthDateBounds(
          startYear,
          m,
        );
        const monthInvoices = fyInvoices.filter(
          (inv) =>
            new Date(inv.invoiceDate) >= mStart &&
            new Date(inv.invoiceDate) < mEnd,
        );

        if (monthInvoices.length > 0) {
          const monthPaidCount = monthInvoices.filter((inv) =>
            paymentMap.has(inv._id.toString()),
          ).length;
          if (monthPaidCount === monthInvoices.length) {
            completedProfitMonths += 1;
            const monthReceived = monthInvoices.reduce((acc, inv) => {
              const p = paymentMap.get(inv._id.toString());
              return acc + (p ? p.amountReceived : 0);
            }, 0);
            const monthExpense = expenseMap.get(`${yr}-${m}`) || 0;
            sumProfit += monthReceived - monthExpense;
          } else {
            pendingProfitMonths += 1;
          }
        }
      });

      realizedProfit = completedProfitMonths > 0 ? sumProfit : null;
    }

    // --- Monthly Overview Data ---
    // --- 6. Monthly Overview Data ---
    // If 'all' is selected, default to July (7) instead of currentCalMonth
    const activeOverviewMonth =
      selectedMonthQuery === "all" ? 7 : Number(selectedMonthQuery);

    const activeOverviewYear =
      activeOverviewMonth >= 4 ? startYear : startYear + 1;

    const { startDate: ovStart, endDate: ovEnd } = getMonthDateBounds(
      startYear,
      activeOverviewMonth,
    );

    const ovInvoices = fyInvoices.filter(
      (inv) =>
        new Date(inv.invoiceDate) >= ovStart &&
        new Date(inv.invoiceDate) < ovEnd,
    );

    let ovInvoiced = 0;
    let ovReceived = 0;
    let ovPaidCount = 0;

    ovInvoices.forEach((inv) => {
      ovInvoiced += inv.totalAmount;
      const p = paymentMap.get(inv._id.toString());
      if (p) {
        ovPaidCount += 1;
        ovReceived += p.amountReceived;
      }
    });

    const ovExpenses =
      expenseMap.get(`${activeOverviewYear}-${activeOverviewMonth}`) || 0;
    const ovAllPaid =
      ovInvoices.length > 0 && ovPaidCount === ovInvoices.length;

    const monthlyOverview = {
      month: activeOverviewMonth,
      year: activeOverviewYear,
      monthName: MONTH_NAMES[FY_MONTH_NUMBERS.indexOf(activeOverviewMonth)],
      totalInvoiced: ovInvoiced,
      totalReceived: ovReceived,
      totalExpenses: ovExpenses,
      totalInvoices: ovInvoices.length,
      paidInvoices: ovPaidCount,
      unpaidInvoices: ovInvoices.length - ovPaidCount,
      allInvoicesPaid: ovAllPaid,
      profit: ovAllPaid ? ovReceived - ovExpenses : null,
    };

    // --- Top 5 Pending Invoices ---
    const pendingInvoices = filteredInvoices
      .filter((inv) => !paymentMap.has(inv._id.toString()))
      .slice(0, 5)
      .map((inv) => ({
        _id: inv._id,
        invoiceNo: inv.invoiceNo,
        companyName: inv.buyer?.name || inv.consignee?.name || "N/A",
        invoiceDate: inv.invoiceDate,
        totalAmount: inv.totalAmount,
        outstanding: inv.totalAmount,
      }));

    // --- Monthly Trend Chart Data (April to March) ---
    const monthlyTrend = FY_MONTH_NUMBERS.map((m, idx) => {
      const yr = m >= 4 ? startYear : startYear + 1;
      const { startDate: mStart, endDate: mEnd } = getMonthDateBounds(
        startYear,
        m,
      );
      const mInvs = fyInvoices.filter(
        (inv) =>
          new Date(inv.invoiceDate) >= mStart &&
          new Date(inv.invoiceDate) < mEnd,
      );

      let mInvoiced = 0;
      let mReceived = 0;

      mInvs.forEach((inv) => {
        mInvoiced += inv.totalAmount;
        const p = paymentMap.get(inv._id.toString());
        if (p) mReceived += p.amountReceived;
      });

      return {
        month: m,
        year: yr,
        label: MONTH_NAMES[idx],
        totalInvoiced: mInvoiced,
        totalReceived: mReceived,
        totalExpenses: expenseMap.get(`${yr}-${m}`) || 0,
      };
    });

    // --- Invoice Status ---
    const totalPaidInvoices = filteredInvoices.filter((inv) =>
      paymentMap.has(inv._id.toString()),
    ).length;
    const totalUnpaidInvoices = filteredInvoices.length - totalPaidInvoices;

    // --- Recent Activity (Combined Invoices & Payments sorted by createdAt) ---
    const recentInvoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const activityList = [
      ...recentInvoices.map((inv) => ({
        type: "INVOICE_CREATED",
        title: "Invoice created",
        invoiceNo: inv.invoiceNo,
        companyName: inv.buyer?.name || "N/A",
        amount: inv.totalAmount,
        createdAt: inv.createdAt,
      })),
      ...recentPayments.map((p) => ({
        type: "PAYMENT_RECEIVED",
        title: "Payment received",
        invoiceNo: p.invoiceNo,
        companyName: p.company?.name || "N/A",
        amount: p.amountReceived,
        createdAt: p.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.status(200).json({
      financialYear: {
        label: `FY ${startYear}–${(startYear + 1).toString().slice(2)}`,
        startYear,
        endYear: startYear + 1,
      },
      filters: {
        month: selectedMonthQuery,
      },
      summary: {
        totalInvoiced,
        totalReceived,
        outstandingReceivables,
        totalTds,
        realizedProfit,
        completedProfitMonths,
        pendingProfitMonths,
        unpaidCount,
      },
      monthlyOverview,
      pendingInvoices,
      monthlyTrend,
      invoiceStatus: {
        paid: totalPaidInvoices,
        unpaid: totalUnpaidInvoices,
      },
      recentActivity: activityList,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load dashboard data", error: error.message });
  }
};
