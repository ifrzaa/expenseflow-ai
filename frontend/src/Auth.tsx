import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isLogin, setIsLogin] = useState(true);

  const theme = {
    background: "#0F0E47",
    button: "#505081",
    accent: "#8686AC",
    text: "#EAEAEA",
  };

  // ✅ Keep user logged in across refreshes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCred.user);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        setUser(userCred.user);
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  if (user) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center transition-all duration-500"
        style={{ backgroundColor: theme.background, color: theme.text }}
      >
        <h1
          className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-indigo-300 to-indigo-100 bg-clip-text text-transparent"
        >
          💰 ExpenseFlow 
        </h1>

        <div
          className="rounded-2xl p-8 w-80 shadow-2xl border text-center backdrop-blur-md"
          style={{
            backgroundColor: "rgba(97, 97, 133, 0.4)",
            borderColor: theme.accent,
          }}
        >
          <h2 className="text-xl font-semibold mb-4">Welcome, {user.email}</h2>
          <button
            onClick={handleLogout}
            className="w-full py-2 rounded-lg font-semibold transition hover:opacity-90"
            style={{
              backgroundColor: theme.button,
              color: theme.text,
            }}
          >
            Logout
          </button>
        </div>

        <p className="text-xs mt-6 opacity-70">
          ExpenseFlow © 2025 — Built by ifrzaa
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center transition-all duration-500"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* 💰 Centered Branding */}
      <h1
        className="text-4xl font-extrabold mb-10 bg-gradient-to-r from-indigo-300 to-indigo-100 bg-clip-text text-transparent drop-shadow-md"
      >
        💰 ExpenseFlow 
      </h1>

      {/* Login / Signup Card */}
      <div
        className="rounded-2xl p-8 w-80 shadow-2xl border backdrop-blur-md"
        style={{
          backgroundColor: "rgba(97, 97, 133, 0.4)",
          borderColor: theme.accent,
        }}
      >
        <h2
          className="text-2xl font-bold mb-6 text-center"
          style={{ color: theme.text }}
        >
          {isLogin ? "Login" : "Sign Up"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-indigo-300/40 bg-transparent rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-indigo-300/40 bg-transparent rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
          />

          <button
            type="submit"
            className="w-full py-2 rounded-lg font-semibold transition hover:opacity-90"
            style={{
              backgroundColor: theme.button,
              color: theme.text,
            }}
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-center mt-4 cursor-pointer font-semibold underline transition hover:opacity-80"
          style={{ color: theme.accent }}
        >
          {isLogin ? "Create an account" : "Already have an account? Login"}
        </p>
      </div>

      <p className="text-xs mt-8 opacity-50">
        ExpenseFlow © 2025 — Built by ifrzaa
      </p>
    </div>
  );
}
