import m from "mithril";
import "../services";
import { FlowEditor } from "../shared/ws-flow-editor";
import { FlowList } from "../shared/ws-flows-list";
import { DevLog } from "../shared/ws-dev-log";
import { dispatch, _events } from "../shared/utils";
import { Layout } from "../shared/ws-layout";

// This repo primarily serves pre-bundled IIFE scripts (no module script tags).
// Set the prefix explicitly so visiting /#!/auth works reliably.
m.route.prefix = "#!";

const mountElement = document.getElementById("app") || document.querySelector("main") || document.body;
m.route(mountElement, "/", {
  "/": {
    onmatch(args) {
      dispatch(_events.flows.refreshList, { args });
    },
    render(vnode) {
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
  "/auth": {
    onmatch() {
      dispatch(_events.auth.login);
      m.route.set(m.route.get())
      return Promise.resolve(); // No-op to allow to stay as is
    }
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
