import m from "mithril";
import "../services";
import "@tailwindplus/elements";
import { Page as FlowsPage } from "../pages/ws-flows";
import { Page as FlowPage } from "../pages/ws-flow";
import { FlowPreview } from "../shared/ws-flow-preview";
import { TagsList } from "../pages/ws-tags-list";
import { Auth } from "../pages/ws-auth";
import { ThemePicker } from "../shared/ws-theme-picker";
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

const Layout = {
  oninit(vnode) {
    vnode.state.menuOpen = false;
    vnode.state.drawerOpen = false;
    this.onbeforeupdate(vnode);
  },
  onbeforeupdate(vnode) {
    vnode.state.loggedIn = globalThis.authService.loggedIn;
  },
  view: (vnode) => {
    const closeMobileMenu = () => {
      const popover = vnode.dom.getElementById("mobile-nav-popover") as (HTMLElement & {
        hidePopover?: () => void;
      }) | null;

      if (popover?.hidePopover) {
        popover.hidePopover();
      } else {
        popover?.removeAttribute("open");
      }

      vnode.state.menuOpen = false;
    };

    return m(".drawer", [
      m("input#tags-drawer", {
        type: "checkbox",
        class: "drawer-toggle",
        checked: vnode.state.drawerOpen,
        onchange: (e) => {
          vnode.state.drawerOpen = e.target.checked;
        }
      }),
      m(".drawer-content", [
        m("main.layout container mx-auto", [
          m(".navbar items-center px-3 md:px-6", [
            m(".navbar-start flex-1 gap-2", [
              Logo,
              m("label.btn.btn-ghost.btn-circle", {
                for: "tags-drawer",
                "aria-label": "Open tags drawer"
              }, m("svg.h-6.w-6", {
                xmlns: "http://www.w3.org/2000/svg",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor"
              }, m("path", {
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                "stroke-width": "2",
                d: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              })))
            ]),
            m(".navbar-end gap-2", [
          m(".hidden md:flex items-center gap-2", [
            m(
              "button.btn btn-ghost",
              {
                onclick: () => {
                  if (vnode.state.loggedIn) {
                    m.route.set("/flow/new");
                  } else {
                    m.route.set("/auth");
                  }
                },
              },
              "New Flow"
            ),
            m(m.route.Link, { href: "/", class: "btn btn-ghost" }, "Flows"),
            !vnode.state.loggedIn &&
              m(
                m.route.Link,
                { href: "/auth", class: "btn btn-ghost" },
                "Login"
              ),
            vnode.state.loggedIn &&
              m(
                "button.btn btn-ghost",
                { onclick: () => dispatch(_events.auth.logout) },
                "Logout"
              ),
          ]),
          m(".md:hidden relative", [
            m(
              "button",
              {
                type: "button",
                class:
                  "inline-flex items-center justify-center rounded-full p-2 text-gray-800 transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-gray-100 dark:hover:bg-gray-800",
                popovertarget: "mobile-nav-popover",
                "aria-controls": "mobile-nav-popover",
                "aria-expanded": vnode.state.menuOpen ? "true" : "false",
                "aria-label": "Toggle navigation menu",
              },
              [
                m("span.sr-only", "Toggle navigation menu"),
                m(
                  "svg",
                  {
                    class: `${vnode.state.menuOpen ? "hidden" : "block"} h-6 w-6` ,
                    xmlns: "http://www.w3.org/2000/svg",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    stroke: "currentColor",
                  },
                  m("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M4 6h16M4 12h16M4 18h16",
                  })
                ),
                m(
                  "svg",
                  {
                    class: `${vnode.state.menuOpen ? "block" : "hidden"} h-6 w-6`,
                    xmlns: "http://www.w3.org/2000/svg",
                    fill: "none",
                    viewBox: "0 0 24 24",
                    stroke: "currentColor",
                  },
                  m("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M6 18L18 6M6 6l12 12",
                  })
                ),
              ]
            ),
            m(
              "el-popover#mobile-nav-popover",
              {
                anchor: "bottom",
                popover: true,
                class:
                  "z-40 mt-3 w-[100vw] overflow-visible rounded-2xl bg-white p-3 text-gray-900 shadow-2xl ring-1 ring-black/10 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-leave:duration-150 dark:bg-slate-900 dark:text-gray-100 dark:ring-white/10",
                onbeforetoggle: (event) => {
                  vnode.state.menuOpen = (event as any)?.newState === "open";
                },
              },
              m("div.flex.flex-col.gap-2", [
                m(
                  "button",
                  {
                    class:
                      "w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-gray-50 dark:hover:bg-slate-800",
                    onclick: () => {
                      closeMobileMenu();
                      if (vnode.state.loggedIn) {
                        m.route.set("/flow/new");
                      } else {
                        m.route.set("/auth");
                      }
                    },
                  },
                  "New Flow"
                ),
                m(
                  m.route.Link,
                  {
                    href: "/",
                    class:
                      "w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-gray-50 dark:hover:bg-slate-800",
                    onclick: () => closeMobileMenu(),
                  },
                  "Flows"
                ),
                !vnode.state.loggedIn &&
                  m(
                    m.route.Link,
                    {
                      href: "/auth",
                      class:
                        "w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-gray-50 dark:hover:bg-slate-800",
                      onclick: () => closeMobileMenu(),
                    },
                    "Login"
                  ),
                vnode.state.loggedIn &&
                  m(
                    "button",
                    {
                      class:
                        "w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-gray-50 dark:hover:bg-slate-800",
                      onclick: () => {
                        closeMobileMenu();
                        dispatch(_events.auth.logout);
                      },
                    },
                    "Logout"
                  ),
              ])
            ),
          ]),
              m(".ml-1 md:ml-3", m(ThemePicker)),
            ]),
          ]),
          m("section.mt-10", vnode.children),
          //end
        ]),
      ]),
      m(".drawer-side", [
        m("label.drawer-overlay", {
          for: "tags-drawer",
          "aria-label": "close sidebar"
        }),
        m(".bg-base-200.text-base-content.min-h-full.w-80 p-2 sm:p-4", [
          m(".flex.justify-between.items-center.mb-4", [
            m("h2.text-xl.font-bold", "Filter by Tags"),
            m("label.btn.btn-sm.btn-circle.btn-ghost.lg:hidden", {
              for: "tags-drawer"
            }, "✕")
          ]),
          m(TagsList)
        ])
      ])
    ]);
  },
};

const L = (child) => {
  return {
    onmatch() {},
    render(vnode) {
      return m(Layout, m(child, vnode.attrs));
    },
  };
};

m.route(document.body, "/", {
  "/": {
    onmatch(args): void {
      if(globalThis.authService?.loggedIn){
        dispatch(_events.action.refreshList, { params: args });
      } else {
        m.route.set("/public");
      }
    },
    render(vnode) {
      return m(Layout, m(FlowsPage, vnode.attrs));
    },
  },
  "/public": {
    onmatch(args): void {
      dispatch(_events.action.refreshList, { filter: 'public', params: args });
    },
    render(vnode) {
      return m(Layout, m(FlowsPage, vnode.attrs));
    },
  },
  "/public/:user_id": {
    onmatch(args): void {
      dispatch(_events.action.refreshList, { filter: 'public', params: args });
    },
    render(vnode) {
      return m(Layout, m(FlowsPage, vnode.attrs));
    },
  },
  "/auth": {
    render(vnode) {
      return m(Layout, m(Auth, vnode.attrs));
    },
  },
  "/tags": {
    render(vnode) {
      return m(Layout, m(TagsList, vnode.attrs));
    },
  },
  "/flow/new": {
    onmatch(): Promise<void> {
      // Check if user is logged in
      if (!globalThis.authService?.loggedIn) {
        m.route.set("/auth");
        return Promise.resolve();
      }

      globalThis.flowService.reset();

      // Trigger initial save - the polling below will wait for the ID to be assigned
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
            message: "Failed to create flow: No ID assigned within 5 seconds",
          });
          reject("Failed to create flow: No ID assigned within 5 seconds");
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
          if (globalThis.flowService.flow.id === args.id) {
            clearTimeout(timeout);
            clearInterval(interval);
            resolve();
          }
        }, 50);

        const timeout = setTimeout(() => {
          clearInterval(interval);
          dispatch(_events.action.actionError, {
            message: `Failed to load flow ${args.id} within 5 seconds`,
          });
          reject(`Failed to load flow ${args.id} within 5 seconds`);
        }, 5000);
      });
    },
    render(vnode) {
      return m(Layout, m(FlowPage, vnode.attrs));
    },
  },
  "/public_flows/:id": {
    onmatch(args, _requestedPath, _route): Promise<void> {
      dispatch(_events.flow.requestPublicFlow, { flowId: args.id });

      return new Promise((resolve, reject) => {
        // TODO: use a proxy to inctercept flowService.flow changes instead of polling?
        // adhoc reactivity
        const interval = setInterval(() => {
          if (globalThis.flowService.flow.id === args.id) {
            clearTimeout(timeout);
            clearInterval(interval);
            resolve();
          }
        }, 50);

        const timeout = setTimeout(() => {
          clearInterval(interval);
          dispatch(_events.action.actionError, {
            message: `Failed to load flow ${args.id} within 5 seconds`,
          });
          reject(`Failed to load flow ${args.id} within 5 seconds`);
        }, 5000);
      });
    },
    render(vnode) {
      return m(Layout, m(FlowPreview, vnode.attrs));
    },
  },
});
