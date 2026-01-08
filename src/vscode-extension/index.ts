import m from "mithril";
import "../services";
import { FlowEditor } from "../shared/ws-flow-editor";
import { FlowList } from "../shared/ws-flows-list";
import { ThemePicker } from "../shared/ws-theme-picker";
import { DevLog } from "../shared/ws-dev-log";
import { TagsList } from "../pages/ws-tags-list";
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
    vnode.state.drawerOpen = false;
  },
  view: (vnode) => {
    const isRootRoute = m.route.get() === "/";
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
          m(
            ".navbar",
            [
              m(".navbar-start.gap-2", [
                Logo,
                isRootRoute && m("label.btn.btn-ghost.btn-circle", {
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
            m(
              m.route.Link,
              { href: "/flow/new", class: "btn btn-ghost" },
              "New Flow"
            ),
            m(m.route.Link, { href: "/", class: "btn btn-ghost" }, "Flows"),
            // TODO: retain the link, but trigger a prompt/modal to guide the user to use the command palette instead
            globalThis.authService.loggedOut && m('button', { class: "btn btn-ghost", onclick: (e) => {
                dispatch(_events.auth.login);
              } }, "Login"),
            globalThis.authService.loggedIn && m('button', { class: "btn btn-ghost", onclick: (e) => {
                dispatch(_events.auth.logout);
              } }, "Logout"),
                m(ThemePicker)
              ]),
            ]
          ),
          m("section.mt-10", vnode.children),
          //end
        ]),
      ]),
      isRootRoute && m(".drawer-side", [
        m("label.drawer-overlay", {
          for: "tags-drawer",
          "aria-label": "close sidebar"
        }),
        m(".menu.bg-base-200.text-base-content.min-h-full.w-80.p-4", [
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

const mountElement = document.getElementById("app") || document.querySelector("main") || document.body;
m.route(mountElement, "/", {
  "/": {
    onmatch() {
      dispatch(_events.action.refreshList, {});
    },
    render(vnode: Vnode) {
      return m(Layout, m(FlowList, vnode.attrs));
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
      return m(Layout, m('.container max-w-6xl mx-auto', m(FlowEditor, vnode.attrs)));
    },
  },
});

// Mount DevLog component to a separate element
const interval = setInterval(() => {
  const devLogMount = document.getElementById("ws-dev-log-mount");
  if (devLogMount) {
    try {
      m.mount(devLogMount, DevLog);
      clearInterval(interval);
    } catch(err){
      console.error("Failed to mount DevLog:", err);
    }
  }
}, 100);
