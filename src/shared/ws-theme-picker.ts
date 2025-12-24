import m from "mithril";
import { storageKeys } from "./utils";

const THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
  "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
  "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
  "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee",
  "winter", "dim", "nord", "sunset", "abyss", "caramellatte", "silk"
];

export const ThemePicker = {
  oninit: () => {
    // Load saved theme from local storage
    const savedTheme = localStorage.getItem(storageKeys.themeChoice);
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  },
  view: () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "cupcake";
    return m("select.select select-sm", {
      value: currentTheme,
      onchange: (e) => {
        const theme = e.target.value;
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(storageKeys.themeChoice, theme);
      },
    }, THEMES.map(theme => 
      m("option", { value: theme }, theme.charAt(0).toUpperCase() + theme.slice(1))
    ));
  },
};