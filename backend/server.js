const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// MongoDB connection
mongoose.connect("mongodb://mongo:27017/financeDB");

// ─── Schema ───────────────────────────────────────────────
const TransactionSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["income", "expense"], required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const Transaction = mongoose.model("Transaction", TransactionSchema);

// ─── Seed sample data on first run ────────────────────────
async function seedData() {
  const count = await Transaction.countDocuments();
  if (count > 0) return;

  const sampleData = [
    // January
    { description: "Monthly Salary", amount: 5000, type: "income", category: "Salary", date: new Date("2025-01-05") },
    { description: "Rent Payment", amount: 1200, type: "expense", category: "Housing", date: new Date("2025-01-01") },
    { description: "Grocery Store", amount: 320, type: "expense", category: "Food", date: new Date("2025-01-08") },
    { description: "Netflix Subscription", amount: 15, type: "expense", category: "Entertainment", date: new Date("2025-01-10") },
    { description: "Electric Bill", amount: 95, type: "expense", category: "Utilities", date: new Date("2025-01-15") },
    { description: "Gas Station", amount: 60, type: "expense", category: "Transport", date: new Date("2025-01-18") },
    { description: "Freelance Project", amount: 800, type: "income", category: "Freelance", date: new Date("2025-01-20") },
    { description: "Restaurant Dinner", amount: 85, type: "expense", category: "Food", date: new Date("2025-01-22") },
    // February
    { description: "Monthly Salary", amount: 5000, type: "income", category: "Salary", date: new Date("2025-02-05") },
    { description: "Rent Payment", amount: 1200, type: "expense", category: "Housing", date: new Date("2025-02-01") },
    { description: "Grocery Store", amount: 290, type: "expense", category: "Food", date: new Date("2025-02-07") },
    { description: "Gym Membership", amount: 50, type: "expense", category: "Health", date: new Date("2025-02-10") },
    { description: "Internet Bill", amount: 70, type: "expense", category: "Utilities", date: new Date("2025-02-12") },
    { description: "Uber Rides", amount: 45, type: "expense", category: "Transport", date: new Date("2025-02-15") },
    { description: "Side Project Income", amount: 600, type: "income", category: "Freelance", date: new Date("2025-02-18") },
    { description: "Movie Tickets", amount: 30, type: "expense", category: "Entertainment", date: new Date("2025-02-22") },
    // March
    { description: "Monthly Salary", amount: 5200, type: "income", category: "Salary", date: new Date("2025-03-05") },
    { description: "Rent Payment", amount: 1200, type: "expense", category: "Housing", date: new Date("2025-03-01") },
    { description: "Grocery Store", amount: 350, type: "expense", category: "Food", date: new Date("2025-03-09") },
    { description: "Spotify Subscription", amount: 12, type: "expense", category: "Entertainment", date: new Date("2025-03-10") },
    { description: "Water Bill", amount: 40, type: "expense", category: "Utilities", date: new Date("2025-03-14") },
    { description: "Car Insurance", amount: 150, type: "expense", category: "Transport", date: new Date("2025-03-17") },
    { description: "Freelance Design Work", amount: 1200, type: "income", category: "Freelance", date: new Date("2025-03-20") },
    { description: "Pharmacy", amount: 65, type: "expense", category: "Health", date: new Date("2025-03-25") },
    // April
    { description: "Monthly Salary", amount: 5200, type: "income", category: "Salary", date: new Date("2025-04-05") },
    { description: "Rent Payment", amount: 1200, type: "expense", category: "Housing", date: new Date("2025-04-01") },
    { description: "Grocery Store", amount: 310, type: "expense", category: "Food", date: new Date("2025-04-06") },
    { description: "Gym Membership", amount: 50, type: "expense", category: "Health", date: new Date("2025-04-10") },
    { description: "Electric Bill", amount: 88, type: "expense", category: "Utilities", date: new Date("2025-04-13") },
    { description: "Gas Station", amount: 55, type: "expense", category: "Transport", date: new Date("2025-04-16") },
    { description: "Dividend Income", amount: 200, type: "income", category: "Investment", date: new Date("2025-04-19") },
    { description: "Concert Tickets", amount: 120, type: "expense", category: "Entertainment", date: new Date("2025-04-23") },
    { description: "Online Course", amount: 49, type: "expense", category: "Education", date: new Date("2025-04-25") },
  ];

  await Transaction.insertMany(sampleData);
  console.log("✅ Seeded sample financial data");
}

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  seedData();
});

// ─── Routes ───────────────────────────────────────────────

// Add transaction
app.post("/api/transactions", async (req, res) => {
  try {
    const { description, amount, type, category, date } = req.body;
    const transaction = new Transaction({ description, amount, type, category, date });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a transaction
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Analytics Dashboard ──────────────────────────────────
app.get("/api/analytics", async (req, res) => {
  try {
    // 1. Overall Summary
    const incomeSummary = await Transaction.aggregate([
      { $match: { type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    const expenseSummary = await Transaction.aggregate([
      { $match: { type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const totalIncome = incomeSummary[0]?.total || 0;
    const totalExpense = expenseSummary[0]?.total || 0;
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    // 2. Expense breakdown by category
    const expenseByCategory = await Transaction.aggregate([
      { $match: { type: "expense" } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avg: { $avg: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // 3. Monthly income vs expense trends
    const monthlyTrends = await Transaction.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Transform monthly trends into chart-friendly format
    const monthMap = {};
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthlyTrends.forEach((item) => {
      const key = `${monthNames[item._id.month]} ${item._id.year}`;
      if (!monthMap[key]) monthMap[key] = { month: key, income: 0, expense: 0 };
      monthMap[key][item._id.type] = item.total;
    });
    const monthlyData = Object.values(monthMap);

    // 4. Top 5 largest expenses
    const topExpenses = await Transaction.find({ type: "expense" })
      .sort({ amount: -1 })
      .limit(5);

    // 5. Daily spending for the latest month
    const latestTransaction = await Transaction.findOne().sort({ date: -1 });
    let dailySpending = [];
    if (latestTransaction) {
      const latestDate = new Date(latestTransaction.date);
      const startOfMonth = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
      const endOfMonth = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 0);

      dailySpending = await Transaction.aggregate([
        {
          $match: {
            type: "expense",
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: { $dayOfMonth: "$date" },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            day: "$_id",
            total: 1,
            _id: 0,
          },
        },
      ]);
    }

    // 6. Income source breakdown
    const incomeByCategory = await Transaction.aggregate([
      { $match: { type: "income" } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({
      summary: {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate: Number(savingsRate),
        transactionCount: (incomeSummary[0]?.count || 0) + (expenseSummary[0]?.count || 0),
      },
      expenseByCategory,
      incomeByCategory,
      monthlyTrends: monthlyData,
      topExpenses,
      dailySpending,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => console.log("🚀 Backend running on port 5000"));
