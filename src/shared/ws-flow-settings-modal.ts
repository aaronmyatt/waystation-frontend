import m from "mithril";
import { _events, dispatch } from "./utils";

export function FlowSettingsModal() {
  let el: HTMLDialogElement | null = null;

  return {
    oninit(vnode){
        globalThis.addEventListener(_events.ui.openFlowSettingsModal, (event) => {
          el && el.showModal();
          vnode.state.flowId = (event as CustomEvent).detail.flowId;
          // default visibility when opening (can be changed by the user)
          vnode.state.visibility = vnode.state.visibility || 'private';
        });
    },
    oncreate(vnode){
      el = vnode.dom;
    },
    onremove(vnode){
      vnode.state.flowId = null;
      el.close();
    },
    view(vnode) {
      return m('dialog.modal', 
        [
          m('.modal-box', 
            [
              m('form', { method: "dialog" },
                m('button.btn btn-sm btn-circle btn-ghost absolute right-2 top-2', { 
                  tabindex: -1, 
                  "aria-label": "Close dialog" 
                }, '✕')
              ),
              m('h3.text-lg font-bold text-base-content mb-4', 'Flow Settings'),
              m('form', {},
                m('.join.join-vertical',
                  [
                    // Private
                    m('label.flex.items-start.justify-between.rounded-lg.p-4.join-item.cursor-pointer.transition-colors', {
                      class: vnode.state.visibility === 'private' ? 'bg-primary/10' : 'hover:bg-base-200',
                      onclick: () => { vnode.state.visibility = 'private'; }
                    }, [
                      m('.flex.items-start', [
                        m('input.radio.radio-primary.mr-4', {
                          type: 'radio', name: 'visibility', value: 'private',
                          checked: vnode.state.visibility === 'private',
                          onchange: () => { vnode.state.visibility = 'private'; }
                        }),
                        m('.ml-1', [
                          m('div.font-semibold.text-base-content', 'Private'),
                          m('div.text-sm.text-base-content/70', 'Only you can view this flow')
                        ])
                      ]),
                      m('div', m('span.badge.badge-neutral', '🔒 Private'))
                    ]),

                    // Draft
                    m('label.flex.items-start.justify-between.rounded-lg.p-4.join-item.cursor-pointer.transition-colors', {
                      class: vnode.state.visibility === 'draft' ? 'bg-warning/10' : 'hover:bg-base-200',
                      onclick: () => { vnode.state.visibility = 'draft'; }
                    }, [
                      m('.flex.items-start', [
                        m('input.radio.radio-warning.mr-4', {
                          type: 'radio', name: 'visibility', value: 'draft',
                          checked: vnode.state.visibility === 'draft',
                          onchange: () => { vnode.state.visibility = 'draft'; }
                        }),
                        m('.ml-1', [
                          m('div.font-semibold.text-base-content', 'Draft'),
                          m('div.text-sm.text-base-content/70', 'Work in progress, only visible to you')
                        ])
                      ]),
                      m('div', m('span.badge.badge-warning', '📝 Draft'))
                    ]),

                    // Public
                    m('label.flex.items-start.justify-between.rounded-lg.p-4.join-item.cursor-pointer.transition-colors', {
                      class: vnode.state.visibility === 'public' ? 'bg-success/10' : 'hover:bg-base-200',
                      onclick: () => { vnode.state.visibility = 'public'; }
                    }, [
                      m('.flex.items-start', [
                        m('input.radio.radio-success.mr-4', {
                          type: 'radio', name: 'visibility', value: 'public',
                          checked: vnode.state.visibility === 'public',
                          onchange: () => { vnode.state.visibility = 'public'; }
                        }),
                        m('.ml-1', [
                          m('div.font-semibold.text-base-content', 'Public'),
                          m('div.text-sm.text-base-content/70', 'Anyone can view this flow without logging in')
                        ])
                      ]),
                      m('div', m('span.badge.badge-success', '🌐 Public'))
                    ])
                  ]
                )
              ),
              m('.modal-action',
                [
                  m('button.btn btn-ghost', {
                      tabindex: -1,
                      "aria-label": "Close settings",
                      onclick: () => {
                          el && el.close();
                      }
                  }, 'Close'),
                  m('button.btn btn-primary', {
                      tabindex: -1,
                      "aria-label": "Save flow settings",
                      onclick: () => {
                          // Save settings
                          dispatch(_events.flow.updateFlowSingular, {
                              flowId: vnode.state.flowId,
                              flow: { status: vnode.state.visibility },
                          });
                          el && el.close();
                      }
                  }, 'Save')
                ]
              )
            ]
          ),
          m('form.modal-backdrop', {
              method: 'dialog',
              onclick: () => { el && el.close(); }
          }, m('button', 'Close'))
        ]
      );
    }
  }
}