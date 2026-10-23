"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextValue {
  theme: "light";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light">("light");

  const toggleTheme = () => {
    throw new Error("Theme switching is disabled. This is a locked single-color design.");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

