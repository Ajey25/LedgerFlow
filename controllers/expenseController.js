import MonthlyExpense from "../models/MonthlyExpense.js";

// GET OR CREATE MONTHLY EXPENSE
export const getOrUpdateExpense = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    let expense = await MonthlyExpense.findOne({
      month: Number(month),
      year: Number(year),
    });

    if (!expense) {
      expense = await MonthlyExpense.create({
        month: Number(month),
        year: Number(year),
      });
    }

    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// SAVE / UPDATE EXPENSES
export const saveExpense = async (req, res) => {
  try {
    const {
      month,
      year,
      purchases,
      rent,
      electricity,
      gstPaid,
      salary,
      otherExpenses,
      notes,
    } = req.body;

    let expense = await MonthlyExpense.findOne({ month, year });

    if (!expense) {
      expense = new MonthlyExpense({ month, year });
    }

    expense.purchases = purchases || 0;
    expense.rent = rent || 0;
    expense.electricity = electricity || 0;
    expense.gstPaid = gstPaid || 0;
    expense.salary = salary || 0;
    expense.otherExpenses = otherExpenses || 0;
    expense.notes = notes || "";

    await expense.save();

    res.status(200).json({ message: "Expenses updated successfully", expense });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to save expenses", error: error.message });
  }
};
