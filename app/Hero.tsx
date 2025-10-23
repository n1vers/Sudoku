"use client";

import { useState, useEffect } from "react";

export default function Hero() {
  const [clicked, setClicked] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Чтобы тема сохранялась в localStorage и применялась при загрузке
  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  };

  return (
    <section className={`hero-section ${darkMode ? "dark" : ""}`}>
      <h1 className="hero-title">
        Welcome to <span className="highlight">Hero UI</span>
      </h1>
      <p className="hero-subtitle">
        Create stunning, animated hero sections effortlessly using Next.js and CSS.
      </p>
      <button
        onClick={() => setClicked(!clicked)}
        className={`hero-button ${clicked ? "clicked" : ""}`}
      >
        {clicked ? "Clicked!" : "Get Started"}
      </button>

      <button onClick={toggleTheme} className="theme-toggle-btn">
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </section>
  );
}
