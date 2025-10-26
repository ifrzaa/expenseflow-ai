import React, { useState } from "react";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker-custom.css";

interface AddExpenseProps {
  theme?: "light" | "dark";
}

export default function AddExpense({ theme = "light" }: AddExpenseProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const auth = getAuth();

  const darkTheme = {
    background: "#0F0E47",
    button: "#505081",
    navbar: "#272757",
    card: "#8686AC",
    text: "#EAEAEA",
  };
  const isDark = theme === "dark";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("You must be logged in!");
    if (!amount || !category) return alert("Amount and category required!");

    await addDoc(collection(db, "expenses"), {
      userId: user.uid,
      amount: Number(amount),
      category,
      description,
      date: Timestamp.fromDate(new Date(date)),
      createdAt: Date.now(),
    });

    setAmount("");
    setCategory("");
    setDescription("");
    setDate(new Date());
    alert("Expense added!");
  }

  return (
    <div
      className={`p-6 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-500 ${
        isDark
          ? ""
          : "bg-white/90 text-gray-900 border-gray-100"
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
      <h2 className="text-xl font-bold mb-4 text-center" style={{ color: isDark ? darkTheme.text : "#4F46E5" }}>Add Expense</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Amount */}
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          style={{
            backgroundColor: isDark ? darkTheme.button : "#fff",
            color: isDark ? darkTheme.text : "#000",
            borderColor: isDark ? darkTheme.button : "#D1D5DB",
          }}
        />

        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          style={{
            backgroundColor: isDark ? darkTheme.button : "#fff",
            color: isDark ? darkTheme.text : "#000",
            borderColor: isDark ? darkTheme.button : "#D1D5DB",
          }}
        >
          <option value="">Select Category</option>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Households">Households</option>
          <option value="Bills">Bills</option>
          <option value="Shopping">Shopping</option>
          <option value="Electronics">Electronics</option>
          <option value="Others">Others</option>
        </select>

        {/* Description */}
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          style={{
            backgroundColor: isDark ? darkTheme.button : "#fff",
            color: isDark ? darkTheme.text : "#000",
            borderColor: isDark ? darkTheme.button : "#D1D5DB",
          }}
        />

        {/* Date Picker */}
        <div className="relative">
          <label
            className="block text-sm mb-1"
            style={{ color: isDark ? darkTheme.text : "#4B5563" }}
          >
            Date
          </label>
          <ReactDatePicker
  selected={date}
  onChange={(d) => setDate(d as Date)}
  className={`w-full border p-3 pl-10 rounded-2xl shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none transition ${
    theme === "dark"
      ? "bg-[#505081] text-[#EAEAEA] border-[#505081]"
      : "bg-white/90 text-gray-900 border-gray-200"
  }`}
  calendarClassName="custom-datepicker-calendar"
  popperClassName="custom-datepicker-popper"
  popperPlacement="bottom-start"
  portalId="root-datepicker-portal"
/>


          <span className="absolute left-3 top-10 text-gray-500 text-lg pointer-events-none">
            📅
          </span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-2 rounded-lg font-semibold transition"
          style={{
            backgroundColor: isDark ? "#C7D2FE" : "#4F46E5",
            color: isDark ? "#0F0E47" : "#fff",
          }}
        >
          Save
        </button>
      </form>
    </div>
  );
}
