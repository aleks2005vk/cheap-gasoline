import React, { createContext, useContext, useEffect, useState } from "react";

// Создаем контекст для темы
const ThemeContext = createContext();

// Провайдер темы
export const ThemeProvider = ({ children }) => {
  // Проверяем сохраненную тему или используем системную
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      return saved === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Переключаем тему
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Сохраняем тему в localStorage и применяем к документу с плавной анимацией
  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    localStorage.setItem("theme", theme);
    
    // Применяем оба способа для полной совместимости
    document.documentElement.setAttribute("data-theme", theme);
    
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Хук для использования темы
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
