import m from 'mithril';
import { _events, dispatch } from './utils';
import { MarkdownRenderer } from './ws-marked'

export function FlowPreview(): m.Component {
    const marked = new MarkdownRenderer({ enableSanitizer: false });

    return {
        oninit(vnode) {
            vnode.state.markdown = globalThis.flowService.markdown || '';
            dispatch(_events.flow.requestFlowPreview, { flowId: vnode.attrs.id });
        },
        onbeforeupdate(vnode) {
            if (globalThis.flowService.markdown !== vnode.state.markdown) {
                vnode.state.markdown = globalThis.flowService.markdown || '';
            }
        },
        view(vnode){
            return m('.p-4 prose max-w-none', m.trust(marked.parse(vnode.state.markdown)));
        }
  };
}
