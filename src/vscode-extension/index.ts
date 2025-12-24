import m from "mithril";
import "../services";
import { FlowEditor } from "../shared/ws-flow-editor";
import { FlowList } from "../shared/ws-flows-list";
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
            // TODO: retain the link, but trigger a prompt/modal to guide the user to use the command palette instead
            // m(m.route.Link, { href: "/auth", class: "btn btn-ghost" }, "Auth"),
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
      return m(Layout, m(FlowEditor, vnode.attrs));
    },
  },
});
