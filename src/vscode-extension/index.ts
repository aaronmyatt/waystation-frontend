import m from "mithril";
import { Flow } from "../shared/ws-flow-page";
import { FlowList } from "../shared/ws-flow-list-page";
import { Auth } from "../shared/ws-auth";
import { dispatch, _events } from "../shared/utils";

const Logo = m(
  m.route.Link,
  { href: "/" },
  m(
    ".text-xl md:text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors duration-200",
    m(
      "span.bg-black text-white px-2 md:px-3 py-1 border-2 border-black shadow-lg transform hover:scale-105 transition-transform duration-200 font-mono tracking-wider text-sm md:text-base",
      "WAYSTATION"
    )
  )
);

const THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
  "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
  "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
  "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee",
  "winter", "dim", "nord", "sunset", "abyss", "caramellatte", "silk"
];

const ThemePicker = {
  oninit: () => {
    // Load saved theme from local storage
    const savedTheme = localStorage.getItem("waystation-theme");
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
        localStorage.setItem("waystation-theme", theme);
      },
    }, THEMES.map(theme => 
      m("option", { value: theme }, theme.charAt(0).toUpperCase() + theme.slice(1))
    ));
  },
};

const Layout = {
  view: (vnode) => {
    return m("main.layout container mx-auto", [
      m(
        ".navbar",
        [
          m(".navbar-start", Logo),
          m(".navbar-end gap-2", [
            m(
              m.route.Link,
              { href: "/flow/new", class: "btn btn-ghost" },
              "New Flow"
            ),
            m(m.route.Link, { href: "/", class: "btn btn-ghost" }, "Flows"),
            m(m.route.Link, { href: "/auth", class: "btn btn-ghost" }, "Auth"),
            m(ThemePicker)
          ]),
        ]
      ),
      m("section.mt-10", vnode.children),
      //end
    ]);
  },
};

const initData = () => {
  // Load initial data if available
  if (globalThis.__INITIAL_DATA__?.flows) {
    try {
      globalThis.flowListService.load(globalThis.__INITIAL_DATA__.flows);
    } catch (err) {
      console.error("Failed to load initial flow data:", err);
    }
  }
};
const L = (child) => {
  return {
    onmatch() {
    },
    render(vnode) {
      return m(Layout, m(child, vnode.attrs));
    },
  };
};

// This repo primarily serves pre-bundled IIFE scripts (no module script tags).
// Set the prefix explicitly so visiting /#!/auth works reliably.
m.route.prefix = "#!";

m.route(document.body, "/", {
  "/": {
    onmatch() {
      initData();
      dispatch(_events.action.refreshList, {});
    },
    render(vnode: Vnode) {
      return m(Layout, m(FlowList, vnode.attrs));
    },
  },
  "/auth": {
    render(vnode) {
      return m(Layout, m(Auth, vnode.attrs));
    },
  },
  "/flow/new": {
    onmatch(): Promise<void> {
      globalThis.flowService.reset();
      
      // Dispatch flow updated event to trigger backend save
      dispatch(_events.flow.updated, globalThis.flowService._flow);

      return new Promise((resolve, reject) => {
        // Check immediately for race condition (ID assigned before polling starts)
        if (globalThis.flowService.flow.id) {
          const newId = globalThis.flowService.flow.id;
          m.route.set(`/flow/${newId}`);
          resolve();
          return;
        }

        // TODO: use a proxy to intercept flowService.flow changes instead of polling?
        // adhoc reactivity - poll for ID assignment
        const interval = setInterval(() => {
          if (globalThis.flowService.flow.id) {
            clearTimeout(timeout);
            clearInterval(interval);
            const newId = globalThis.flowService.flow.id;
            m.route.set(`/flow/${newId}`);
            resolve();
          }
        }, 50);

        const timeout = setTimeout(() => {
          clearInterval(interval);
          dispatch(_events.action.actionError, { 
            message: 'Failed to create flow: No ID assigned within 5 seconds' 
          });
          reject('Failed to create flow: No ID assigned within 5 seconds');
        }, 5000);
      });
    },
    render(vnode) {
      return m(Layout, m(Flow, vnode.attrs));
    },
  },
  "/flow/:id": {
    onmatch(args, _requestedPath, _route): Promise<void> {
      dispatch(_events.action.requestFlow, { flowId: args.id });     

      return new Promise((resolve, reject) => {

        // TODO: use a proxy to inctercept flowService.flow changes instead of polling?
        // adhoc reactivity
        const interval = setInterval(() => {
          if(globalThis.flowService.flow.id === args.id) {
            clearTimeout(timeout);
            clearInterval(interval);
            resolve();
          }
        }, 50);

        const timeout = setTimeout(() => {
          clearInterval(interval);
          dispatch(_events.action.actionError, { 
            message: `Failed to load flow ${args.id} within 5 seconds` 
          });
          reject(`Failed to load flow ${args.id} within 5 seconds` );
        }, 5000);
      })
    },
    render(vnode) {
      return m(Layout, m(Flow, vnode.attrs));
    },
  },
});
