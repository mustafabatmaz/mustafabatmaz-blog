import { useEffect, useState, type ReactNode } from "react";
import { applyTheme, readStoredTheme, type Theme } from "./theme";
import { ThemeContext } from "./ThemeContext";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The function form reads storage once, on the first render only
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  // Keeps the <html> class and storage in step with React state: synchronizing with something outside
  // React is what effects are for
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>;
}
