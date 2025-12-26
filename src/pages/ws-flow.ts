import m from "mithril";
import { FlowEditor } from "../shared/ws-flow-editor";
import { FlowPreview } from "../shared/ws-flow-preview";
import { _events } from "../shared/utils";

function updateQueryParam(param: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', param);
  window.history.replaceState({}, '', url.toString());
}

export function Page(): m.Component {
  return {
    oninit(vnode) {
      const query = m.parseQueryString(window.location.search);
      // Always default to preview first, will switch to editor after flow loads if user can edit
      vnode.state.activeTab = query.tab || 'preview';
    },
    onupdate(vnode) {
      // After flow loads, switch to editor tab if user can edit and no tab was specified
      if (!m.parseQueryString(window.location.search).tab) {
        const canEdit = globalThis.flowService?.canEdit();
        const isNewFlow = globalThis.flowService?.isCreatingNew();
        // Only auto-switch to editor for new flows or owned flows
        if (canEdit && isNewFlow && vnode.state.activeTab === 'preview') {
          vnode.state.activeTab = 'editor';
        }
      }
    },
    view(vnode) {
      const canEdit = globalThis.flowService?.canEdit();

      // If can't edit and trying to view editor tab, force to preview
      if (!canEdit && vnode.state.activeTab === 'editor') {
        vnode.state.activeTab = 'preview';
      }

      return m('.container mx-auto p-2 sm:p-4 max-w-5xl',
        [
          m('.tabs tabs-boxed mb-4',
            [
              m('button.tab', {
                class: vnode.state.activeTab === 'preview' ? 'tab-active' : '',
                onclick: () => {
                  vnode.state.activeTab = 'preview';
                  updateQueryParam('preview');
                }
              }, 'Preview'),
              // Only show Edit tab if user can edit this flow
              canEdit ? m('button.tab', {
                class: vnode.state.activeTab === 'editor' ? 'tab-active' : '',
                onclick: () => {
                  vnode.state.activeTab = 'editor';
                  updateQueryParam('editor');
                }
              }, 'Edit') : null,
            ]
          ),
          vnode.state.activeTab === 'preview' ? m('.preview-container', m(FlowPreview, { id: vnode.attrs.id })) : null,
          vnode.state.activeTab === 'editor' && canEdit ? m(FlowEditor, { id: vnode.attrs.id }) : null
      ]);
    },
  };
}
