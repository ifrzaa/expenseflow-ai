import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface EditExpenseProps {
  expense: any;
  onClose: () => void;
  theme?: "light" | "dark";
}

export default function EditExpense({ expense, onClose, theme = "light" }: EditExpenseProps) {
  const [amount, setAmount] = useState(expense.amount);
  const [category, setCategory] = useState(expense.category);
  const [description, setDescription] = useState(expense.description);

  const darkTheme = {
    background: "#0F0E47",
    button: "#505081",
    navbar: "#272757",
    card: "#8686AC",
    text: "#EAEAEA",
  };

  const isDark = theme === "dark";

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();

    const ref = doc(db, "expenses", expense.id);
    await updateDoc(ref, {
      amount: parseFloat(amount),
      category,
      description,
    });

    alert("Expense updated!");
    onClose(); // Close and return to details view
  }

  return (
    <form
      onSubmit={handleUpdate}
      className={`rounded-xl p-4 transition-all duration-500 ${
        isDark ? "" : "bg-white text-gray-900"
      }`}
      style={
        isDark
          ? {
              backgroundColor: darkTheme.card,
              color: darkTheme.text,
            }
          : {}
      }
    >
    
      <label className="block text-sm mb-1 font-semibold">Amount (RM)</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full border rounded-lg p-2 mb-3 focus:outline-none"
        required
        style={{
          backgroundColor: isDark ? darkTheme.button : "#fff",
          color: isDark ? darkTheme.text : "#000",
          borderColor: isDark ? darkTheme.button : "#D1D5DB",
        }}
      />

      <label className="block text-sm mb-1 font-semibold">Category</label>
      <input
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full border rounded-lg p-2 mb-3 focus:outline-none"
        required
        style={{
          backgroundColor: isDark ? darkTheme.button : "#fff",
          color: isDark ? darkTheme.text : "#000",
          borderColor: isDark ? darkTheme.button : "#D1D5DB",
        }}
      />

      <label className="block text-sm mb-1 font-semibold">Description</label>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border rounded-lg p-2 mb-4 focus:outline-none"
        style={{
          backgroundColor: isDark ? darkTheme.button : "#fff",
          color: isDark ? darkTheme.text : "#000",
          borderColor: isDark ? darkTheme.button : "#D1D5DB",
        }}
      />

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 py-2 rounded font-semibold transition"
          style={{
            backgroundColor: isDark ? "#C7D2FE" : "#4F46E5",
            color: isDark ? "#0F0E47" : "#fff",
          }}
        >
          Save
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 rounded font-semibold transition"
          style={{
            backgroundColor: isDark ? darkTheme.button : "#E5E7EB",
            color: isDark ? darkTheme.text : "#111",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
