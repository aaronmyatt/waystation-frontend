import m from "mithril";
import { storageKeys } from "./utils";

const THEMES = [
  "corporate", "light", "dark", "cupcake", "bumblebee", "emerald", "synthwave",
  "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
  "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
  "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee",
  "winter", "dim", "nord", "sunset", "abyss", "caramellatte", "silk"
];

export const ThemePicker = {
  oninit: (vnode) => {
    // Load saved theme from local storage
    const savedTheme = localStorage.getItem(storageKeys.themeChoice);
    document.documentElement.setAttribute("data-theme", savedTheme || "corporate");
    vnode.state.isOpen = false;
  },
  view: (vnode) => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "corporate";
    return m("select.select select-sm", {
      value: currentTheme,
      // Allow toggling the native select closed on repeated clicks
      onmousedown: (e: MouseEvent) => {
        const select = e.currentTarget as HTMLSelectElement;
        if (vnode.state.isOpen) {
          e.preventDefault();
          select.blur();
          vnode.state.isOpen = false;
          return;
        }
        vnode.state.isOpen = true;
      },
      onblur: () => {
        vnode.state.isOpen = false;
      },
      onchange: (e: Event) => {
        const select = e.target as HTMLSelectElement;
        const theme = select.value;
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(storageKeys.themeChoice, theme);
        vnode.state.isOpen = false;
      },
    }, THEMES.map(theme => 
      m("option", { value: theme }, theme.charAt(0).toUpperCase() + theme.slice(1))
    ));
  },
};