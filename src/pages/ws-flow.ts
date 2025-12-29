import m from "mithril";
import { FlowEditor } from "../shared/ws-flow-editor";
import { FlowPreview } from "../shared/ws-flow-preview";

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
      const canEdit = vnode.state.canEdit;

      return m('.container mx-auto p-2 sm:p-4 max-w-5xl',
        [
          m('.tabs tabs-boxed mb-4',
            [
              m('button.tab', {
                class: vnode.state.activeTab === 'preview' ? 'tab-active' : '',
                onclick: () => {
                  vnode.state.activeTab = 'preview';
                }
              }, 'Preview'),
              // Only show Edit tab if user can edit this flow
              canEdit ? m('button.tab', {
                class: vnode.state.activeTab === 'editor' ? 'tab-active' : '',
                onclick: () => {
                  vnode.state.activeTab = 'editor';
                }
              }, 'Edit') : null,
            ]
          ),
          vnode.state.activeTab === 'preview' ? m('.preview-container', m(FlowPreview, { id: vnode.attrs.id })) : null,
          (vnode.state.activeTab === 'editor' && canEdit) ? m(FlowEditor, { id: vnode.attrs.id }) : null
      ]);
    },
  };
}
