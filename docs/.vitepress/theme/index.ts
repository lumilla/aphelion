// Custom VitePress theme that includes Aphelion styles
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";

// Import Aphelion styles for the demo pages
// Uses the alias defined in .vitepress/config.ts
import "@lumilla/aphelion/styles.css";

export default {
  extends: DefaultTheme,
} satisfies Theme;
