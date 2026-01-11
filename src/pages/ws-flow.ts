import m from "mithril";
import { FlowEditor } from "../shared/ws-flow-editor";
import { FlowPreview } from "../shared/ws-flow-preview";
import { _events, dispatch } from "../shared/utils";

export function Page(): m.Component {
  return {
    oninit(vnode) {
      vnode.state.canEdit = globalThis.flowService?.canEdit();
      vnode.state.activeTab = 'editor';

      this.onupdate(vnode);
    },
    onbeforeupdate(vnode) {
      vnode.state.canEdit = globalThis.flowService?.canEdit();
    },
    onupdate(vnode) {
      if (!vnode.state.canEdit) {
        vnode.state.activeTab = 'preview';
      }
    },
    onremove() {
      globalThis.flowService.clear();
    },
    view(vnode) {
      return m('.container mx-auto max-w-6xl',
        [
          m('.tabs tabs-boxed mb-4',
            [
              m('button.tab', {
                class: vnode.state.activeTab === 'preview' ? 'tab-active' : '',
                onclick: () => {
                  vnode.state.activeTab = 'preview';
                  dispatch(_events.flow.requestFlowPreview, { flowId: vnode.attrs.id });
                }
              }, 'Preview'),
              // Only show Edit tab if user can edit this flow
              m('button.tab', {
                class: vnode.state.activeTab === 'editor' ? 'tab-active' : '',
                onclick: () => {
                  vnode.state.activeTab = 'editor';
                  dispatch(_events.action.requestFlow, { flowId: vnode.attrs.id });
                }
              }, 'Edit'),
            ]
          ),
          vnode.state.activeTab === 'preview' ? m('.preview-container', m(FlowPreview, { id: vnode.attrs.id })) : null,
          vnode.state.activeTab === 'editor' ? m(FlowEditor, { id: vnode.attrs.id }) : null
      ]);
    },
  };
}
