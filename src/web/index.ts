import m from "mithril";
import "../services";
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
    this.onbeforeupdate(vnode);
  },
  onbeforeupdate(vnode) {
    vnode.state.loggedIn = globalThis.authService.loggedIn;
  },
  view: (vnode) => {
    return m("main.layout container mx-auto", [
      m(".navbar", [
        m(".navbar-start", Logo),
        m(".navbar-end gap-2", [
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
            m(m.route.Link, { href: "/auth", class: "btn btn-ghost" }, "Login"),
          vnode.state.loggedIn &&
            m(
              "button.btn btn-ghost",
              { onclick: () => dispatch(_events.auth.logout) },
              "Logout"
            ),
          m(ThemePicker),
        ]),
      ]),
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
    onmatch() {},
    render(vnode) {
      return m(Layout, m(child, vnode.attrs));
    },
  };
};

m.route(document.body, "/", {
  "/": {
    onmatch(args): void {
      initData();
      if(globalThis.authService?.loggedIn){
        dispatch(_events.action.refreshList, { params: args });
      } else {
        dispatch(_events.action.refreshList, { filter: 'public', params: args });
      }
        
    },
    render(vnode: Vnode) {
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
      dispatch(_events.flow.requestPublicFlow, { public: true, flowId: args.id });

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
