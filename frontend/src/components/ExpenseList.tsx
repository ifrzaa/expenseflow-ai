import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import EditExpense from "./EditExpense";
import { motion } from "framer-motion";

export default function ExpenseList({ theme = "light" }: { theme?: "light" | "dark" }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 🎨 Theme colors
  const darkTheme = {
    background: "#0F0E47",
    button: "#2727419a",
    navbar: "#1A1758",
    card: "#61618593",
    text: "#EAEAEA",
  };

  const isDark = theme === "dark";

  // ✅ Track current user
  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUserId(currentUser ? currentUser.uid : null);
    });
    return () => unsubscribeAuth();
  }, []);

  // ✅ Fetch expenses from Firestore
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "expenses"),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(data);
    });

    return () => unsubscribe();
  }, [userId]);

  // ✅ Delete function
  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await deleteDoc(doc(db, "expenses", id));
    alert("Expense deleted!");
  }

  // ✅ Category color tags
  function categoryColor(category: string) {
    if (isDark) {
      switch (category) {
        case "Food":
          return "bg-red-900 text-red-200";
        case "Transport":
          return "bg-green-900 text-green-200";
        case "Games":
          return "bg-blue-900 text-blue-200";
        case "Bills":
          return "bg-yellow-900 text-yellow-200";
        case "Shopping":
          return "bg-purple-900 text-purple-200";
        default:
          return "bg-gray-700 text-gray-200";
      }
    } else {
      switch (category) {
        case "Food":
          return "bg-red-100 text-red-700";
        case "Transport":
          return "bg-green-100 text-green-700";
        case "Games":
          return "bg-blue-100 text-blue-700";
        case "Bills":
          return "bg-yellow-100 text-yellow-700";
        case "Shopping":
          return "bg-purple-100 text-purple-700";
        default:
          return "bg-gray-100 text-gray-700";
      }
    }
  }

  // ✅ Apply filtering
  const filteredExpenses = expenses.filter((exp) => {
    const date = exp.date?.toDate ? exp.date.toDate() : new Date(exp.date);
    if (!date) return false;

    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear().toString();

    if (filterMonth && month !== filterMonth) return false;
    if (filterYear && year !== filterYear) return false;

    return true;
  });

  return (
    <div
      className={`relative flex flex-col h-full p-6 rounded-2xl shadow-lg border backdrop-blur-md overflow-hidden transition-all duration-500 ${
        isDark ? "" : "bg-white/90 text-gray-900 border-gray-100"
      }`}
      style={
        isDark
          ? {
          backgroundColor: darkTheme.card,
          color: darkTheme.text,
          borderColor: "#505081",
          height: "100%",
        }
      : { height: "100%" }
      }
    >
      {/* Header + Filters (sticky header) */}
      <div className="flex justify-between items-center mb-4">
        
          <h2
            className="text-xl font-bold"
            style={{ color: isDark ? darkTheme.text : "#4F46E5" }}
          >
            My Expenses
          </h2>

          <div className="flex gap-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="border rounded-md text-sm px-2 py-1 focus:outline-none focus:ring transition"
              style={{
                backgroundColor: isDark ? darkTheme.button : "#fff",
                borderColor: isDark ? "#505081" : "#D1D5DB",
                color: isDark ? darkTheme.text : "#111",
              }}
            >
              <option value="">All Months</option>
              {[
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="border rounded-md text-sm px-2 py-1 focus:outline-none focus:ring transition"
              style={{
                backgroundColor: isDark ? darkTheme.button : "#fff",
                borderColor: isDark ? "#505081" : "#D1D5DB",
                color: isDark ? darkTheme.text : "#111",
              }}
            >
              <option value="">All Years</option>
              {[...new Set(
                expenses.map((e) =>
                  e.date?.toDate
                    ? e.date.toDate().getFullYear()
                    : new Date(e.date).getFullYear()
                )
              )]
                .sort((a, b) => b - a)
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>

            <button
              onClick={() => {
                setFilterMonth("");
                setFilterYear("");
              }}
              className="px-3 py-1 rounded-lg text-sm font-medium transition"
              style={{
                backgroundColor: isDark ? darkTheme.button : "#E5E7EB",
                color: isDark ? darkTheme.text : "#111",
              }}
            >
              Reset
            </button>
          </div>
      </div>

      {/* Scrollable table fills the rest */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500">
        {expenses.length === 0 ? (
          <div
            className="text-center py-8"
            style={{ color: isDark ? "#C7C7E2" : "#9CA3AF" }}
          >
            <p className="text-lg">No expenses yet 💤</p>
            <p className="text-sm">Add your first expense to see it here!</p>
          </div>
        ) : (
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr
                className="text-sm uppercase"
                style={{
                  backgroundColor: isDark ? darkTheme.navbar : "#F3F4F6",
                  color: isDark ? darkTheme.text : "#374151",
                }}
              >
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-right">Amount (RM)</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <motion.tr
                  key={exp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelectedExpense(exp)}
                  className="border-b transition cursor-pointer"
                  style={{
                    borderColor: isDark ? "#505081" : "#E5E7EB",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = isDark
                      ? "#505081"
                      : "#F3F4F6")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <td className="p-3 font-medium">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColor(
                        exp.category
                      )}`}
                    >
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-3 opacity-90">
                    {exp.description || (
                      <span className="italic opacity-60">No description</span>
                    )}
                  </td>
                  <td className="p-3 text-sm opacity-80">
                    {exp.date?.toDate
                      ? exp.date.toDate().toLocaleDateString()
                      : exp.date}
                  </td>
                  <td
                    className="p-3 pr-6 text-right font-semibold"
                    style={{
                      color: isDark ? "#C7D2FE" : "#2563EB",
                    }}
                  >
                    {Number(exp.amount).toLocaleString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 🪟 Expense Detail / Edit Modal (unchanged) */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={() => {
              setSelectedExpense(null);
              setIsEditing(false);
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-2xl" />
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 p-6 rounded-2xl shadow-2xl w-[90%] max-w-md border transition-all duration-300"
            style={{
              backgroundColor: isDark ? darkTheme.card : "#FFFFFFE6",
              color: isDark ? darkTheme.text : "#111",
              borderColor: isDark ? "#505081" : "#E5E7EB",
            }}
          >
            {!isEditing ? (
              <>
                <h2
                  className="text-xl font-bold text-center mb-4"
                  style={{ color: isDark ? darkTheme.text : "#4F46E5" }}
                >
                  Expense Details
                </h2>
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">Category:</span>{" "}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${categoryColor(
                        selectedExpense.category
                      )}`}
                    >
                      {selectedExpense.category}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Description:</span>{" "}
                    {selectedExpense.description || (
                      <span className="italic opacity-70">No description</span>
                    )}
                  </p>
                  <p>
                    <span className="font-semibold">Date:</span>{" "}
                    {selectedExpense.date?.toDate
                      ? selectedExpense.date.toDate().toLocaleDateString()
                      : selectedExpense.date}
                  </p>
                  <p>
                    <span className="font-semibold">Amount:</span>{" "}
                    <span
                      style={{
                        color: isDark ? "#C7D2FE" : "#4F46E5",
                      }}
                      className="font-semibold"
                    >
                      RM {Number(selectedExpense.amount).toLocaleString()}
                    </span>
                  </p>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg text-white font-semibold transition"
                    style={{
                      backgroundColor: isDark ? darkTheme.button : "#4F46E5",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(selectedExpense.id);
                      setSelectedExpense(null);
                    }}
                    className="px-4 py-2 rounded-lg text-white font-semibold transition"
                    style={{
                      backgroundColor: "#EF4444",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2
                  className="text-xl font-bold text-center mb-4"
                  style={{ color: isDark ? darkTheme.text : "#4F46E5" }}
                >
                  Edit Expense
                </h2>
                <EditExpense
                  theme={theme}
                  expense={selectedExpense}
                  onClose={() => {
                    setIsEditing(false);
                    setSelectedExpense(null);
                  }}
                />
              </>
            )}

            <button
              onClick={() => {
                setSelectedExpense(null);
                setIsEditing(false);
              }}
              className="absolute top-4 right-4 text-lg font-bold opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
