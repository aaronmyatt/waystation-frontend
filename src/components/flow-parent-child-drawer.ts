import m from "mithril";
import { FlowRelationService } from "../services/flow-relation";
import { flowRelationsSvg } from "../shared/ws-svg";
import { FlowCard } from "../shared/ws-flows-list";

interface FlowParentChildModalAttrs {
  flow: any;
}

/**
 * FlowParentChildModal is a modal component that displays parent and child flow relationships.
 * It uses daisyUI's modal component with HTML dialog element for the UI and FlowRelationService to manage data.
 *
 * This component shows:
 * - Parent flow (if this flow was copied from another)
 * - Child flows (flows that were created as copies/branches from this flow)
 *
 * Users can navigate to related flows by clicking on them.
 *
 * Usage:
 * ```typescript
 * // Store reference to the dialog element
 * let dialogRef: HTMLDialogElement | null = null;
 *
 * // In your view:
 * m('button', { onclick: () => dialogRef?.showModal() }, 'Show Relations'),
 * m(FlowParentChildModal, {
 *   flow: currentFlow,
 *   oncreate: (vnode) => { dialogRef = vnode.dom as HTMLDialogElement; }
 * })
 * ```
 */
export function FlowParentChildModal(): m.Component<FlowParentChildModalAttrs> {
  
  return {
    oninit(vnode) {
      // Create a component-local instance of FlowRelationService
      // This keeps state independent for different modal instances
      vnode.state.relationService = new FlowRelationService();

      // Fetch relations when modal is initialized
      if (vnode.attrs?.id) {
        vnode.state.relationService.fetchRelations(vnode.attrs.id);
      }
    },

    oncreate(vnode) {
      // Store reference to the dialog element
      vnode.state.dialog = vnode.dom.querySelector("dialog") as HTMLDialogElement;
    },

    onbeforeupdate(vnode, old) {
      if (vnode.attrs?.id !== old.attrs?.id) {
        vnode.state.dialog.close();
        vnode.state.relationService.fetchRelations(vnode.attrs.id);
      }
    },

    view(vnode) {
      return m('.', {}, [ m(
        "button.btn btn-sm btn-ghost text-secondary",
        {
          tabindex: -1,
          "aria-label": "View flow relations",
          onclick: (e) => {
            vnode.state.dialog?.showModal();
          },
        },
        [
          m("span.block size-4", [
            m.trust(flowRelationsSvg),
          ]),
        ],
      ),
      m("dialog.modal", [
        m(".modal-box.max-w-2xl", [
          // Header with close button
          m(
            ".flex justify-between items-center mb-4 pb-3 border-b border-base-300",
            [
              m("h2.text-lg font-semibold", "Flow Relations"),
              m(
                "button.btn btn-sm btn-circle btn-ghost",
                {
                  onclick: (e) => {
                    e.stopPropagation();
                    vnode.state.dialog.close();
                  },
                  "aria-label": "Close",
                },
                "✕",
              ),
            ],
          ),

          // Loading state
          // vnode.state.relationService.loading &&
          //   m(".flex justify-center items-center py-8", [
          //     m("span.loading loading-spinner loading-lg"),
          //   ]),

          // Error state
          vnode.state.relationService.error &&
            m(".alert alert-error mb-4", [
              m("span", vnode.state.relationService.error),
            ]),

          // Content - show when not loading
          !vnode.state.relationService.loading &&
            m(".overflow-y-auto max-h-96", [
              // Parent flow section
              m(".mb-6", [
                m(
                  "h3.text-sm font-semibold text-base-content/70 uppercase mb-3",
                  "Parent Flow",
                ),
                vnode.state.relationService.parent
                  ? m('a', { 
                      onclick(e) {
                        // Clean up the service
                        m.route.set(`/flow/${vnode.state.relationService.parent.id}`);
                      }}, [
                      m(FlowCard, {
                        flow: vnode.state.relationService.parent,
                        settingsModalEnabled: false,
                      }),
                    ])
                  : m(
                      "p.text-sm text-base-content/50 italic",
                      "No parent flow",
                    ),
              ]),

              // Children flows section
              m(".mb-6", [
                m(
                  "h3.text-sm font-semibold text-base-content/70 uppercase mb-3",
                  [
                    "Child Flows ",
                    vnode.state.relationService.children.length > 0 &&
                      m(
                        "span.badge badge-sm badge-neutral",
                        vnode.state.relationService.children.length,
                      ),
                  ],
                ),
                vnode.state.relationService.children.length > 0
                  ? m(
                      ".space-y-2",
                      vnode.state.relationService.children.map((child: any) =>
                        m('a', { 
                          onclick(e) {
                          // Clean up the service
                          m.route.set(`/flow/${child.id}`);
                          }}, [
                          m(FlowCard, { flow: child, settingsModalEnabled: false })
                        ])
                      ),
                    )
                  : m(
                      "p.text-sm text-base-content/50 italic",
                      "No child flows",
                    ),
              ]),

              // Info message when no relations exist
              !vnode.state.relationService.hasRelations() &&
                !vnode.state.relationService.loading &&
                !vnode.state.relationService.error &&
                m(".alert alert-info", [
                  m(
                    "svg",
                    {
                      xmlns: "http://www.w3.org/2000/svg",
                      fill: "none",
                      viewBox: "0 0 24 24",
                      class: "stroke-current shrink-0 w-6 h-6",
                    },
                    [
                      m("path", {
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "2",
                        d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                      }),
                    ],
                  ),
                  m("span", "This flow has no parent or child flows."),
                ]),
            ]),
        ]),

        // Modal backdrop - clicking it closes the modal
        m(
          "form.modal-backdrop",
          {
            method: "dialog",
          },
          [m("button", "close")],
        ),
      ])
    ])
    }
  }
}
