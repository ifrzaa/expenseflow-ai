import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getWeekRangeLabel, parseExpenseDate } from "../utils/timeBuckets";

interface InsightsProps {
  viewMode: "week" | "month" | "year";
  selectedWeek?: string;
  selectedMonth?: string;
  selectedYear?: string;
  selectedMonthYear: string;
  theme?: "light" | "dark";
}

export default function Insights({
  viewMode,
  selectedWeek,
  selectedMonth,
  selectedYear,
  theme = "light",
}: InsightsProps) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [insights, setInsights] = useState<string[]>([]);

  const darkTheme = {
    background: "#0F0E47",
    button: "#2727419a",
    navbar: "#272757",
    card: "#61618593", 
    text: "#EAEAEA",
  };
  const isDark = theme === "dark";

  // 🔹 Track user
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUserId(u ? u.uid : null));
    return unsub;
  }, []);

  // 🔹 Fetch data
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "expenses"),
      where("userId", "==", userId),
      orderBy("date", "asc")
    );
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setExpenses(data);
    });
  }, [userId]);

  // 🔹 Analyze and build insights
  useEffect(() => {
    if (expenses.length === 0) {
      setInsights(["No data yet to analyze your spending."]);
      return;
    }

    if (viewMode === "week" && !selectedWeek) {
      setInsights(["Select a week to see insights."]);
      return;
    }

    // Filter
    let filtered: any[] = [];

    if (viewMode === "week" && selectedWeek) {
      filtered = expenses.filter((exp) => {
        const d = parseExpenseDate(exp);
        return d ? getWeekRangeLabel(d) === selectedWeek : false;
      });
    } else if (viewMode === "month" && selectedMonth) {
      filtered = expenses.filter((exp) => {
        const d = parseExpenseDate(exp);
        if (!d) return false;
        const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        return label === selectedMonth;
      });
    } else if (viewMode === "year" && selectedYear) {
      filtered = expenses.filter((exp) => {
        const d = parseExpenseDate(exp);
        return d ? d.getFullYear().toString() === selectedYear : false;
      });
    }

    if (filtered.length === 0) {
      setInsights([`No ${viewMode} data available for the selected period.`]);
      return;
    }

    // Aggregations
    const totalsByDate: Record<string, number> = {};
    const totalsByCategory: Record<string, number> = {};
    const totalsByWeekday: Record<string, number> = {};

    filtered.forEach((exp) => {
      const d = parseExpenseDate(exp);
      if (!d) return;
      const amt = Number(exp.amount) || 0;

      totalsByDate[d.toDateString()] = (totalsByDate[d.toDateString()] || 0) + amt;

      const cat = exp.category || "Uncategorized";
      totalsByCategory[cat] = (totalsByCategory[cat] || 0) + amt;

      const wkday = d.toLocaleDateString("en-US", { weekday: "long" });
      totalsByWeekday[wkday] = (totalsByWeekday[wkday] || 0) + amt;
    });

    const totalSpent = Object.values(totalsByDate).reduce((a, b) => a + b, 0);
    const daysCount = Object.keys(totalsByDate).length || 1;
    const avgPerDay = totalSpent / daysCount;

    const topCategory = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])[0];
    const topDay = Object.entries(totalsByWeekday).sort((a, b) => b[1] - a[1])[0];

    // Week-over-week comparison
    let prevChangeText = "";
    if (viewMode === "week" && selectedWeek) {
      const [range, yearStr] = selectedWeek.split(",").map((s) => s.trim());
      const startPart = range.split("–")[0].trim();
      const selectedStart = new Date(`${startPart}, ${yearStr}`);

      const prevStart = new Date(selectedStart);
      prevStart.setDate(prevStart.getDate() - 7);
      const prevLabel = getWeekRangeLabel(prevStart);

      const prevWeekExpenses = expenses.filter((exp) => {
        const d = parseExpenseDate(exp);
        return d ? getWeekRangeLabel(d) === prevLabel : false;
      });
      const prevTotal = prevWeekExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      if (prevTotal === 0 && totalSpent === 0) {
        prevChangeText = "🟰 Spending is steady compared to last week.";
      } else if (prevTotal === 0 && totalSpent > 0) {
        prevChangeText = "🆕 You started spending this week (no spend last week).";
      } else {
        const pct = ((totalSpent - prevTotal) / prevTotal) * 100;
        prevChangeText =
          pct > 0
            ? `📈 Up ${pct.toFixed(1)}% vs last week.`
            : pct < 0
            ? `📉 Down ${Math.abs(pct).toFixed(1)}% vs last week.`
            : "🟰 Same as last week.";
      }
    }

    // Messages
    const list: string[] = [];
    if (viewMode === "week" && selectedWeek) list.push(`📅 Weekly snapshot for <b>${selectedWeek}</b>`);
    if (viewMode === "month" && selectedMonth) list.push(`🗓️ Monthly snapshot for <b>${selectedMonth}</b>`);
    if (viewMode === "year" && selectedYear) list.push(`📊 Yearly snapshot for <b>${selectedYear}</b>`);

    if (topCategory)
      list.push(`🏆 Top category: <b>${topCategory[0]}</b> (RM ${topCategory[1].toFixed(2)}).`);

    if (topDay)
      list.push(`📌 Busiest day: <b>${topDay[0]}</b> (RM ${topDay[1].toFixed(2)}).`);

    list.push(`💰 Total spent: <b>RM ${totalSpent.toFixed(2)}</b>.`);
    list.push(`📉 Average per day: <b>RM ${avgPerDay.toFixed(2)}</b>.`);

    if (viewMode === "week") list.push(prevChangeText);

    if (viewMode === "week") {
      const allWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const noSpendDays = allWeekdays.filter((w) => !totalsByWeekday[w]);
      if (noSpendDays.length > 0) {
        list.push(`🧘 No-spend days: <b>${noSpendDays.join(", ")}</b>.`);
      }
    }

    setInsights(list);
  }, [expenses, viewMode, selectedWeek, selectedMonth, selectedYear]);

  return (
   <div
  className={`p-6 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-500 flex flex-col justify-between h-full mt-4 ${
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
  <div className="flex flex-col justify-start flex-grow pt-4 pb-6">
    <h2
      className="text-2xl font-bold mb-6"
      style={{ color: isDark ? darkTheme.text : "#4F46E5" }}
    >
      Insights
    </h2>

    <ul className="list-disc pl-6 space-y-3 text-base leading-relaxed flex-grow">
      {insights.map((msg, i) => (
        <li key={i} dangerouslySetInnerHTML={{ __html: msg }} />
      ))}
    </ul>
  </div>
</div>

  );
}
