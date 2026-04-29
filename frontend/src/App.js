import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Receipt,
  Plus, RefreshCcw, Trash2, ArrowUpRight, ArrowDownRight
} from "lucide-react";

const API = "http://localhost:5000/api";

const CATEGORY_COLORS = [
  "#6366f1", "#06b6d4", "#a855f7", "#f59e0b",
  "#22c55e", "#ef4444", "#ec4899", "#14b8a6"
];

const EXPENSE_CATEGORIES = [
  "Housing", "Food", "Transport", "Utilities",
  "Entertainment", "Health", "Education", "Other"
];

const INCOME_CATEGORIES = [
  "Salary", "Freelance", "Investment", "Business", "Other"
];

function formatCurrency(val) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1e2235", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "8px", padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
    }}>
      <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: "0.85rem", fontWeight: 600 }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

function App() {
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [form, setForm] = useState({
    description: "", amount: "", type: "expense",
    category: "Food", date: new Date().toISOString().split("T")[0]
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, transactionsRes] = await Promise.all([
        axios.get(`${API}/analytics`),
        axios.get(`${API}/transactions`)
      ]);
      setAnalytics(analyticsRes.data);
      setTransactions(transactionsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    try {
      await axios.post(`${API}/transactions`, {
        ...form, amount: Number(form.amount)
      });
      setForm({ ...form, description: "", amount: "" });
      fetchData();
    } catch (err) {
      console.error("Error adding transaction:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/transactions/${id}`);
      fetchData();
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="app-container">
      {/* ─── Header ─── */}
      <header className="app-header">
        <div>
          <h1>💰 FinScope Analytics</h1>
          <p>Personal finance tracking & spending analysis</p>
        </div>
        <div className="header-actions">
          <div className="tab-nav">
            <button className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}>Dashboard</button>
            <button className={`tab-btn ${activeTab === "add" ? "active" : ""}`}
              onClick={() => setActiveTab("add")}>Add Entry</button>
            <button className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}>History</button>
          </div>
          <button className="btn btn-ghost" onClick={fetchData}>
            <RefreshCcw size={16} className={loading ? "spin" : ""} />
          </button>
        </div>
      </header>

      {/* ─── Add Transaction Form ─── */}
      {activeTab === "add" && (
        <form className="card" style={{ marginBottom: "1.5rem" }} onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: "1rem", fontSize: "0.95rem" }}>New Transaction</h3>
          <div className="form-row">
            <div className="form-group" style={{ flex: "0 0 auto", minWidth: "auto" }}>
              <label>Type</label>
              <div className="type-toggle">
                <button type="button"
                  className={form.type === "income" ? "active-income" : ""}
                  onClick={() => setForm({ ...form, type: "income", category: "Salary" })}>
                  Income
                </button>
                <button type="button"
                  className={form.type === "expense" ? "active-expense" : ""}
                  onClick={() => setForm({ ...form, type: "expense", category: "Food" })}>
                  Expense
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input placeholder="e.g. Grocery shopping" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group" style={{ maxWidth: 140 }}>
              <label>Amount ($)</label>
              <input type="number" placeholder="0.00" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group" style={{ maxWidth: 160 }}>
              <label>Category</label>
              <select value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ maxWidth: 160 }}>
              <label>Date</label>
              <input type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end" }}>
              <Plus size={16} /> Add
            </button>
          </div>
        </form>
      )}

      {/* ─── Dashboard ─── */}
      {activeTab === "dashboard" && analytics && (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="card stat-card green">
              <div className="stat-icon green"><TrendingUp size={18} /></div>
              <div className="stat-label">Total Income</div>
              <div className="stat-value" style={{ color: "var(--accent-green)" }}>
                {formatCurrency(analytics.summary.totalIncome)}
              </div>
            </div>
            <div className="card stat-card red">
              <div className="stat-icon red"><TrendingDown size={18} /></div>
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value" style={{ color: "var(--accent-red)" }}>
                {formatCurrency(analytics.summary.totalExpense)}
              </div>
            </div>
            <div className="card stat-card blue">
              <div className="stat-icon blue"><Wallet size={18} /></div>
              <div className="stat-label">Net Savings</div>
              <div className="stat-value" style={{
                color: analytics.summary.netSavings >= 0 ? "var(--accent-green)" : "var(--accent-red)"
              }}>
                {formatCurrency(analytics.summary.netSavings)}
              </div>
            </div>
            <div className="card stat-card purple">
              <div className="stat-icon purple"><PiggyBank size={18} /></div>
              <div className="stat-label">Savings Rate</div>
              <div className="stat-value">{analytics.summary.savingsRate}%</div>
            </div>
            <div className="card stat-card amber">
              <div className="stat-icon amber"><Receipt size={18} /></div>
              <div className="stat-label">Transactions</div>
              <div className="stat-value">{analytics.summary.transactionCount}</div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="charts-grid">
            <div className="card">
              <div className="chart-header">
                <h3>Monthly Income vs Expenses</h3>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.monthlyTrends} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#94a3b8" }} />
                    <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="chart-header">
                <h3>Expense Distribution</h3>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.expenseByCategory} dataKey="total" nameKey="_id"
                      cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                      stroke="none" paddingAngle={3}>
                      {analytics.expenseByCategory.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "0.7rem" }}
                      formatter={(val) => <span style={{ color: "#94a3b8" }}>{val}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="two-col">
            <div className="card">
              <div className="chart-header">
                <h3>Daily Spending (Current Month)</h3>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.dailySpending}>
                    <defs>
                      <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false}
                      tickFormatter={(d) => `Day ${d}`} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false}
                      tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="total" name="Spending"
                      stroke="#a855f7" fill="url(#dailyGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="chart-header">
                <h3>Spending by Category</h3>
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                {analytics.expenseByCategory.map((cat, i) => {
                  const maxTotal = analytics.expenseByCategory[0]?.total || 1;
                  const pct = ((cat.total / maxTotal) * 100).toFixed(0);
                  const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                  return (
                    <div key={cat._id}>
                      <div className="category-item">
                        <div className="category-info">
                          <div className="category-dot" style={{ background: color }} />
                          <div>
                            <div className="category-name">{cat._id}</div>
                            <div className="category-count">{cat.count} transactions · avg {formatCurrency(cat.avg)}</div>
                          </div>
                        </div>
                        <div className="category-amount">{formatCurrency(cat.total)}</div>
                      </div>
                      <div className="category-bar-track">
                        <div className="category-bar-fill"
                          style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Expenses */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="chart-header">
              <h3>🔥 Top 5 Largest Expenses</h3>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topExpenses.map((t, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{t.description}</td>
                      <td><span className="badge badge-expense">{t.category}</span></td>
                      <td className="amount-negative">{formatCurrency(t.amount)}</td>
                      <td style={{ color: "var(--text-dim)" }}>
                        {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Income Sources */}
          {analytics.incomeByCategory.length > 0 && (
            <div className="card">
              <div className="chart-header">
                <h3>Income Sources</h3>
              </div>
              <div className="chart-container" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.incomeByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="_id" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false}
                      tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="total" name="Total" stroke="#22c55e"
                      strokeWidth={2} dot={{ r: 5, fill: "#22c55e" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Transaction History ─── */}
      {activeTab === "history" && (
        <div className="card">
          <div className="chart-header">
            <h3>All Transactions ({transactions.length})</h3>
          </div>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <p>No transactions yet. Add your first entry!</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t._id}>
                      <td style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
                        {new Date(t.date).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        <span style={{ marginRight: 6 }}>
                          {t.type === "income"
                            ? <ArrowUpRight size={14} color="var(--accent-green)" style={{ verticalAlign: "middle" }} />
                            : <ArrowDownRight size={14} color="var(--accent-red)" style={{ verticalAlign: "middle" }} />
                          }
                        </span>
                        {t.description}
                      </td>
                      <td><span className="badge badge-expense">{t.category}</span></td>
                      <td>
                        <span className={`badge ${t.type === "income" ? "badge-income" : "badge-expense"}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={t.type === "income" ? "amount-positive" : "amount-negative"}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                      </td>
                      <td>
                        <button className="delete-btn" onClick={() => handleDelete(t._id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
