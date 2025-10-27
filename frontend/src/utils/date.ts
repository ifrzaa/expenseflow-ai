// src/utils/timeBuckets.ts

// ---------- Date helpers ----------
export function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// IMPORTANT: keep the same label format used in Dashboard & Insights
// Example: "Oct 21 – Oct 27, 2025" (Mon–Sun, then ", YEAR")
export function getWeekRangeLabel(date: Date) {
  const start = getMonday(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const year = start.getFullYear();
  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}, ${year}`;
}

// Safe Firestore/ISO date parse (works for Timestamp or string)
export function parseExpenseDate(exp: any): Date | null {
  if (!exp?.date) return null;
  if (typeof exp.date?.toDate === "function") return exp.date.toDate();
  if (typeof exp.date === "string") return new Date(exp.date);
  return null;
}

// ---------- Available options builders ----------
export function getAvailableYears(expenses: any[]): string[] {
  return Array.from(
    new Set(
      expenses
        .map((e) => parseExpenseDate(e))
        .filter(Boolean)
        .map((d) => (d as Date).getFullYear().toString())
    )
  ).sort((a, b) => Number(a) - Number(b));
}

export function getAvailableWeeks(expenses: any[]): string[] {
  return Array.from(
    new Set(
      expenses
        .map((e) => parseExpenseDate(e))
        .filter(Boolean)
        .map((d) => getWeekRangeLabel(d as Date))
    )
  ).sort(
    (a, b) =>
      new Date(a!.split("–")[0]).getTime() - new Date(b!.split("–")[0]).getTime()
  );
}

export function getAvailableMonthsInYear(expenses: any[], year: string): string[] {
  if (!year) return [];
  return Array.from(
    new Set(
      expenses
        .map((e) => parseExpenseDate(e))
        .filter(Boolean)
        .filter((d) => (d as Date).getFullYear().toString() === year)
        .map((d) =>
          (d as Date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        )
    )
  ).sort((a, b) => new Date(a!).getTime() - new Date(b!).getTime());
}

// ---------- Filtering ----------
export type ViewMode = "week" | "month" | "year";

export function filterForPie(
  expenses: any[],
  viewMode: ViewMode,
  selectedWeek: string,
  selectedMonth: string,
  selectedYear: string
) {
  return expenses.filter((exp) => {
    const d = parseExpenseDate(exp);
    if (!d) return false;

    if (viewMode === "week") {
      return getWeekRangeLabel(d) === selectedWeek;
    }
    if (viewMode === "month") {
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      return label === selectedMonth;
    }
    if (viewMode === "year") {
      return d.getFullYear().toString() === selectedYear;
    }
    return true;
  });
}

export function filterForLine(
  expenses: any[],
  viewMode: ViewMode,
  selectedWeek: string,
  selectedMonthYear: string
) {
  return expenses.filter((exp) => {
    const d = parseExpenseDate(exp);
    if (!d) return false;

    if (viewMode === "week") {
      return getWeekRangeLabel(d) === selectedWeek;
    }
    if (viewMode === "month") {
      return d.getFullYear().toString() === selectedMonthYear; // show all months in selected year
    }
    if (viewMode === "year") {
      return true; // all expenses, we aggregate by year
    }
    return true;
  });
}

// ---------- Aggregations ----------
export function buildCategoryTotals(expenses: any[]): Record<string, number> {
  const out: Record<string, number> = {};
  expenses.forEach((exp) => {
    const amt = Number(exp.amount) || 0;
    const cat = exp.category || "Uncategorized";
    out[cat] = (out[cat] || 0) + amt;
  });
  return out;
}

export function buildDateTotals(
  expenses: any[],
  viewMode: ViewMode
  
): Record<string, number> {
  const out: Record<string, number> = {};
  expenses.forEach((exp) => {
    const d = parseExpenseDate(exp);
    if (!d) return;

    let key = "";
    if (viewMode === "week") key = d.toISOString().slice(0, 10);
    else if (viewMode === "month") key = d.toLocaleDateString("en-US", { month: "short" });
    else if (viewMode === "year") key = d.getFullYear().toString();

    out[key] = (out[key] || 0) + Number(exp.amount);
  });

  // Ensure full month axis for month view
  if (viewMode === "month") {
    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].forEach((m) => {
      if (!(m in out)) out[m] = 0;
    });
  }

  return out;
}

// ---------- Sorting ----------
export function sortXAxisKeys(viewMode: ViewMode, obj: Record<string, number>): string[] {
  if (viewMode === "month") {
    const order = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return Object.keys(obj).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }
  if (viewMode === "year") {
    return Object.keys(obj).sort((a, b) => Number(a) - Number(b));
  }
  // week (ISO dates)
  return Object.keys(obj).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}
