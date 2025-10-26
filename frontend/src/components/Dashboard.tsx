import React, { useEffect, useMemo, useState } from "react";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  getWeekRangeLabel,
  parseExpenseDate,
  getAvailableYears,
  getAvailableMonthsInYear,
  filterForPie,
  filterForLine,
  buildCategoryTotals,
  buildDateTotals,
  sortXAxisKeys,
} from "../utils/timeBuckets";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import AddExpense from "./AddExpense";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
  ChartDataLabels
);

function isCurrentWeek(weekLabel: string) {
  const now = new Date();
  const currentLabel = getWeekRangeLabel(now);
  return weekLabel === currentLabel;
}

interface DashboardProps {
  viewMode: "week" | "month" | "year";
  setViewMode: React.Dispatch<React.SetStateAction<"week" | "month" | "year">>;
  selectedWeek: string;
  setSelectedWeek: React.Dispatch<React.SetStateAction<string>>;
  selectedMonth: string;
  setSelectedMonth: React.Dispatch<React.SetStateAction<string>>;
  selectedYear: string;
  setSelectedYear: React.Dispatch<React.SetStateAction<string>>;
  selectedMonthYear: string;
  setSelectedMonthYear: React.Dispatch<React.SetStateAction<string>>;
  theme?: "light" | "dark";
}

export default function Dashboard({
  viewMode,
  setViewMode,
  selectedWeek,
  setSelectedWeek,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedMonthYear,
  setSelectedMonthYear,
  theme = "light",
}: DashboardProps) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // 🎨 Dark theme (same as ExpenseList)
  const darkTheme = {
    background: "#0F0E47",
    button: "#2727419a",
    navbar: "#272757",
    card: "#61618593", 
    text: "#EAEAEA",
  };
  const isDark = theme === "dark";

  // Auth
  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (u) => setUserId(u ? u.uid : null));
  }, []);

  // Data fetching
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "expenses"),
      where("userId", "==", userId),
      orderBy("date", "asc")
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(data);
    });
  }, [userId]);

  useEffect(() => {
    document.body.style.overflow = showAddExpense ? "hidden" : "";
  }, [showAddExpense]);

  const availableYears = useMemo(() => getAvailableYears(expenses), [expenses]);
  const availableWeeksByYear = useMemo(() => {
    const map = new Map<string, string[]>();
    expenses.forEach((exp) => {
      const d = parseExpenseDate(exp);
      if (!d) return;
      const label = getWeekRangeLabel(d);
      const year = d.getFullYear().toString();
      if (!map.has(year)) map.set(year, []);
      const arr = map.get(year)!;
      if (!arr.includes(label)) arr.push(label);
    });
    return new Map([...map.entries()].sort(([a], [b]) => Number(a) - Number(b)));
  }, [expenses]);
  const allWeeks = Array.from(availableWeeksByYear.values()).flat();
  const availableMonthsInSelectedYear = useMemo(
    () => getAvailableMonthsInYear(expenses, selectedMonthYear),
    [expenses, selectedMonthYear]
  );

  useEffect(() => {
    if (!selectedWeek && allWeeks.length > 0) {
      setSelectedWeek(allWeeks[allWeeks.length - 1]);
    }
  }, [allWeeks, selectedWeek, setSelectedWeek]);

  useEffect(() => {
    if (!selectedMonthYear) {
      const fallback = String(new Date().getFullYear());
      setSelectedMonthYear(
        availableYears.includes(fallback)
          ? fallback
          : availableYears[availableYears.length - 1] || fallback
      );
    }
  }, [availableYears, selectedMonthYear, setSelectedMonthYear]);

  useEffect(() => {
    if (viewMode !== "month") return;
    if (availableMonthsInSelectedYear.length === 0) {
      setSelectedMonth("");
      return;
    }
    const monthYearOfSelected = selectedMonth.split(" ").pop();
    if (monthYearOfSelected !== selectedMonthYear || !selectedMonth) {
      setSelectedMonth(
        availableMonthsInSelectedYear[availableMonthsInSelectedYear.length - 1]
      );
    }
  }, [viewMode, selectedMonthYear, availableMonthsInSelectedYear, selectedMonth, setSelectedMonth]);

  // Data filtering
  const filteredExpensesForPie = useMemo(
    () => filterForPie(expenses, viewMode, selectedWeek, selectedMonth, selectedYear),
    [expenses, viewMode, selectedWeek, selectedMonth, selectedYear]
  );
  const filteredExpensesForLine = useMemo(
    () => filterForLine(expenses, viewMode, selectedWeek, selectedMonthYear),
    [expenses, viewMode, selectedWeek, selectedMonthYear]
  );
  const categoryTotals = useMemo(
    () => buildCategoryTotals(filteredExpensesForPie),
    [filteredExpensesForPie]
  );
  const dateTotals = useMemo(
    () => buildDateTotals(filteredExpensesForLine, viewMode, selectedMonthYear),
    [filteredExpensesForLine, viewMode, selectedMonthYear]
  );
  const sortedKeys = useMemo(() => sortXAxisKeys(viewMode, dateTotals), [viewMode, dateTotals]);

  // Chart colors
  const chartText = isDark ? darkTheme.text : "#111";
  const gridColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";

  const pieData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        data: Object.values(categoryTotals),
        backgroundColor: [
          "#3B82F6",
          "#22C55E",
          "#F59E0B",
          "#EF4444",
          "#8B5CF6",
          "#14B8A6",
        ],
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { color: chartText } },
      datalabels: {
        color: "#fff",
        font: { weight: "bold" as const },
        formatter: (value: number, context: any) => {
          const total = context.chart.data.datasets[0].data.reduce(
            (a: number, b: number) => a + b,
            0
          );
          return total ? `${((value / total) * 100).toFixed(1)}%` : "0%";
        },
      },
    },
  };

  const lineData = {
    labels: sortedKeys,
    datasets: [
      {
        label: `Spending by ${viewMode}`,
        data: sortedKeys.map((k) => dateTotals[k]),
        borderColor: isDark ? "#C7D2FE" : "#3B82F6",
        backgroundColor: isDark
          ? "rgba(199,210,254,0.25)"
          : "rgba(59,130,246,0.2)",
        tension: 0.3,
        fill: sortedKeys.length > 1,
        pointRadius: 5,
        pointBackgroundColor: isDark ? "#C7D2FE" : "#3B82F6",
        pointHoverRadius: 7,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      x: { ticks: { color: chartText }, grid: { color: gridColor } },
      y: { beginAtZero: true, ticks: { color: chartText }, grid: { color: gridColor } },
    },
    plugins: { legend: { position: "bottom" as const, labels: { color: chartText } } },
  };

  return (
    <>
      <div
        className={`p-6 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-500 ${
          isDark ? "" : "bg-white/90 text-gray-900 border-gray-100"
        }`}
        style={
          isDark
            ? {
                backgroundColor: darkTheme.card,
                color: darkTheme.text,
                borderColor: darkTheme.button,
              }
            : {}
        }
      >
        <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: isDark ? darkTheme.text : "#4F46E5" }}>Dashboard</h2>

        {/* Add Expense button */}
        <div className="flex justify-start mb-4">
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full shadow-md transition"
            style={{
              backgroundColor: isDark ? darkTheme.button : "#4F46E5",
              color: isDark ? darkTheme.text : "#C7D2FE",
            }}
          >
            Add Expense
          </button>
        </div>

        {/* Tabs + Week selector */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div className="flex gap-3">
            {["week", "month", "year"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as "week" | "month" | "year")}
                className="px-4 py-2 rounded-full text-sm font-semibold transition shadow-sm"
                style={{
                  backgroundColor:
                    viewMode === mode
                      ? isDark
                        ? "#C7D2FE"
                        : "#4F46E5"
                      : isDark
                      ? darkTheme.button
                      : "#F3F4F6",
                  color:
                    viewMode === mode
                      ? isDark
                        ? "#0F0E47"
                        : "#fff"
                      : isDark
                      ? darkTheme.text
                      : "#111",
                }}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {viewMode === "week" && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => {
                  const idx = allWeeks.indexOf(selectedWeek);
                  if (idx > 0) setSelectedWeek(allWeeks[idx - 1]);
                }}
                className="px-3 py-1 text-sm rounded transition"
                style={{
                  backgroundColor: isDark ? darkTheme.button : "#E5E7EB",
                  color: isDark ? darkTheme.text : "#111",
                }}
              >
                ⬅️
              </button>

              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="border rounded-md text-sm px-3 py-2 shadow-sm"
                style={{
                  backgroundColor: isDark ? darkTheme.button : "#fff",
                  color: isDark ? darkTheme.text : "#111",
                  borderColor: isDark ? darkTheme.button : "#D1D5DB",
                }}
              >
                {[...availableWeeksByYear.entries()].map(([year, weeks]) => (
                  <optgroup key={year} label={`📅 ${year}`}>
                    {weeks.map((w) => (
                      <option key={w} value={w}>
                        {w}
                        {isCurrentWeek(w) ? " (Current Week)" : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <button
                onClick={() => {
                  const idx = allWeeks.indexOf(selectedWeek);
                  if (idx < allWeeks.length - 1) setSelectedWeek(allWeeks[idx + 1]);
                }}
                className="px-3 py-1 text-sm rounded transition"
                style={{
                  backgroundColor: isDark ? darkTheme.button : "#E5E7EB",
                  color: isDark ? darkTheme.text : "#111",
                }}
              >
                ➡️
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {filteredExpensesForPie.length === 0 && filteredExpensesForLine.length === 0 ? (
          <p className="text-center opacity-80">No data to display for this period.</p>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 justify-center items-stretch">
            {/* Pie */}
            <div
              className="p-4 rounded-2xl w-full lg:w-1/2 shadow-md h-[380px] flex flex-col"
              style={{
                backgroundColor: isDark ? darkTheme.card : "#fff",
                color: isDark ? darkTheme.text : "#000",
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold flex-1 text-center" style={{ color: isDark ? darkTheme.text : "#000" }}>
                  Spending by Category (
                  {viewMode === "week"
                    ? selectedWeek
                    : viewMode === "month"
                    ? selectedMonth
                    : selectedYear}
                  )
                </h3>

                {/* Month / Year dropdowns */}
                {viewMode === "month" && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="ml-auto border rounded-md text-sm px-2 py-1"
                    style={{
                      backgroundColor: isDark ? darkTheme.button : "#fff",
                      color: isDark ? darkTheme.text : "#111",
                      borderColor: isDark ? darkTheme.button : "#D1D5DB",
                    }}
                  >
                    {availableMonthsInSelectedYear.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                )}

                {viewMode === "year" && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="ml-auto border rounded-md text-sm px-2 py-1"
                    style={{
                      backgroundColor: isDark ? darkTheme.button : "#fff",
                      color: isDark ? darkTheme.text : "#111",
                      borderColor: isDark ? darkTheme.button : "#D1D5DB",
                    }}
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex-1 relative">
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>

            {/* Line */}
            <div
              className="p-4 rounded-2xl w-full lg:w-1/2 shadow-md h-[340px] flex flex-col"
              style={{
                backgroundColor: isDark ? darkTheme.card : "#fff",
                color: isDark ? darkTheme.text : "#000",
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold" style={{ color: isDark ? darkTheme.text : "#000" }}>Spending Over Time ({viewMode})</h3>

                {viewMode === "month" && (
                  <select
                    value={selectedMonthYear}
                    onChange={(e) => setSelectedMonthYear(e.target.value)}
                    className="ml-auto border rounded-md text-sm px-2 py-1"
                    style={{
                      backgroundColor: isDark ? darkTheme.button : "#fff",
                      color: isDark ? darkTheme.text : "#111",
                      borderColor: isDark ? darkTheme.button : "#D1D5DB",
                    }}
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex-1 relative">
                <Line data={lineData} options={lineOptions} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowAddExpense(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-[90%] max-w-md rounded-2xl shadow-2xl transform transition-all duration-300"
            style={{
              backgroundColor: isDark ? darkTheme.card : "#fff",
              color: isDark ? darkTheme.text : "#111",
              border: `1px solid ${isDark ? darkTheme.button : "#E5E7EB"}`,
            }}
          >
            <AddExpense theme={theme}/>
            <button
              onClick={() => setShowAddExpense(false)}
              className="absolute top-4 right-4 text-lg font-bold opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
