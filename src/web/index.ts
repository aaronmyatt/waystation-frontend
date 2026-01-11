import m from "mithril";
import "../services";
import "@tailwindplus/elements";
import { Page as FlowsPage } from "../pages/ws-flows";
import { Page as FlowPage } from "../pages/ws-flow";
import { FlowPreview } from "../shared/ws-flow-preview";
import { TagsList } from "../pages/ws-tags-list";
import { Auth } from "../pages/ws-auth";
import { Layout } from "../shared/ws-layout"
import { dispatch, _events } from "../shared/utils";

m.route(document.body, "/", {
  "/": {
    onmatch(args): void {
      if(globalThis.authService?.loggedIn){
        dispatch(_events.flows.refreshList, { params: args });
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
      dispatch(_events.flows.publicOnly, { filter: 'public', params: args });
    },
    render(vnode) {
      return m(Layout, m(FlowsPage, vnode.attrs));
    },
  },
  "/public/:user_id": {
    onmatch(args): void {
      dispatch(_events.flows.publicOnly, { params: args });
    },
    render(vnode) {
      return m(Layout, m(FlowsPage, vnode.attrs));
    },
  },
  "/repo/:repo_username/:repo_name": {
    onmatch(args): void {
      dispatch(_events.flows.filterByRepo, { params: args });
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
