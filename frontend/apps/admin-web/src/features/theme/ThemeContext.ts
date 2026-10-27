import { createContext } from "react";
import type { Theme } from "./theme";

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

// null outside a ThemeProvider, so useTheme can fail loudly instead of returning a silent default
export const ThemeContext = createContext<ThemeContextValue | null>(null);
