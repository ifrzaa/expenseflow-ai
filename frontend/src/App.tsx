import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Auth from "./Auth";
import ExpenseList from "./components/ExpenseList";
import Dashboard from "./components/Dashboard";
import Insights from "./components/Insights";
import ThemeToggle from "./components/ThemeToggle";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { LogOut } from "lucide-react";

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"week" | "month" | "year">("month");
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(
    String(new Date().getFullYear())
  );
  const [theme, setTheme] = useState<"light" | "dark">(() => {
  const savedTheme = localStorage.getItem("theme");
  return savedTheme === "dark" ? "dark" : "light";
});

  const themes = {
    light: {
      background: "#E0E4F2",
      button: "#B7C9E8",
      navbar: "#4F46E5",
      text: "#1E1E1E",
    },
    dark: {
      background: "#0F0E47",
      button: "#505081",
      navbar: "#1A1758",
      card: "#8686AC",
      text: "#EAEAEA",
    },
  };

  // ✅ Theme handling
  useEffect(() => {
  if (theme === "dark") document.body.classList.add("dark");
  else document.body.classList.remove("dark");

  // 🧩 Save user preference
  localStorage.setItem("theme", theme);
  }, [theme]);


  // ✅ Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  // ✅ Logout
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // ✅ Loading state
  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: themes[theme].background,
          color: themes[theme].text,
        }}
      >
        <p className="text-lg animate-pulse">Loading...</p>
      </div>
    );

  // ✅ If user not logged in — show clean login page
  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: themes.dark.background,
          color: themes.dark.text,
        }}
      >
        <Auth />
      </div>
    );
  }

  // ✅ Main Dashboard (user logged in)
  return (
    <div
      className="min-h-screen flex flex-col transition-all duration-500"
      style={{
        background: themes[theme].background,
        color: themes[theme].text,
      }}
    >
      {/* Navbar */}
      <header
        className="flex justify-between items-center px-8 py-5 shadow-md border-b transition-all duration-500"
        style={{
          backgroundColor: themes[theme].navbar,
          color: themes[theme].text,
          borderColor: theme === "light" ? "#B7C9E8" : "#3A2555",
        }}
      >
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-300 to-indigo-100 bg-clip-text text-transparent">
          💰 ExpenseFlow
        </h1>

        <div className="flex gap-3 items-center">
          {/* ✅ Use the real ThemeToggle with props */}
          <ThemeToggle theme={theme} setTheme={setTheme} />

          {/* Logout button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition ${
              theme === "dark"
                ? "bg-[#505081] hover:bg-[#8686AC] text-[#EAEAEA]"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
            title="Logout"
          >
            <LogOut size={20} strokeWidth={2} />
          </motion.button>
        </div>
      </header>

      {/* Main Dashboard */}
      <motion.main
        className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 p-8 items-stretch"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="lg:col-span-1 flex flex-col h-full">
          <ExpenseList theme={theme} />
        </div>
        <div className="lg:col-span-2 flex flex-col justify-between h-full">
          <div className="flex-1 flex flex-col gap-6">
            <Dashboard
              theme={theme}
              viewMode={viewMode}
              setViewMode={setViewMode}
              selectedWeek={selectedWeek}
              setSelectedWeek={setSelectedWeek}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedMonthYear={selectedMonthYear}
              setSelectedMonthYear={setSelectedMonthYear}
            />
            <Insights
              theme={theme}
              viewMode={viewMode}
              selectedWeek={selectedWeek}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              selectedMonthYear={selectedMonthYear}
            />
          </div>
        </div>
      </motion.main>

      {/* Footer */}
      <footer
        className="text-center p-4 text-sm border-t transition-all duration-500"
        style={{
          backgroundColor: themes[theme].navbar,
          color: themes[theme].text,
          borderColor: theme === "light" ? "#B7C9E8" : "#3A2555",
        }}
      >
        ExpenseFlow © 2025 — Built by ifrzaa
      </footer>
    </div>
  );
}

export default App;
