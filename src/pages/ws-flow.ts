import m from "mithril";
import { FlowEditor } from "../shared/ws-flow-editor";
import { FlowPreview } from "../shared/ws-flow-preview";
import { _events } from "@waystation/shared/utils";

function updateQueryParam(param: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', param);
  window.history.replaceState({}, '', url.toString());
}

export function Page(): m.Component {
  return {
    oninit(vnode) {
      const query = m.parseQueryString(window.location.search);
      vnode.state.activeTab = query.tab || 'editor';
    },
    view(vnode) {
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
              m('button.tab', {
                class: vnode.state.activeTab === 'editor' ? 'tab-active' : '',
                onclick: () => {
                  vnode.state.activeTab = 'editor';
                  updateQueryParam('editor');
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
