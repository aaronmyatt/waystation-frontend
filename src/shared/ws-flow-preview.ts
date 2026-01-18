import m from 'mithril';
import { MarkdownRenderer } from './ws-marked'
import { syntaxHighlighter } from './ws-hljs';
import { TagsInput } from './ws-flow-tag-input';
import { FlowGitInfo } from '../components/flow-git-info';

export function FlowPreview(): m.Component {
    const marked = new MarkdownRenderer({ enableSanitizer: false });

    return {
        oninit(vnode) {
            vnode.state.flow = globalThis.flowService.flow;
            vnode.state.markdown = globalThis.flowService.markdown || '';
            vnode.state.containerWidth = 0;
        },
        onbeforeupdate(vnode) {
            if (globalThis.flowService.markdown !== vnode.state.markdown) {
                vnode.state.flow = globalThis.flowService.flow;
                vnode.state.markdown = globalThis.flowService.markdown || '';
            }
        },
        onupdate() {
            // Highlight code blocks in markdown preview
            syntaxHighlighter.highlightAll();
        },
        view(vnode){
            return m('.p-2 sm:p-4', [
                m(FlowGitInfo, { flow: vnode.state.flow }),
                m(TagsInput, { flow: vnode.state.flow, enableCrud: false }),
                m('.prose max-w-none', m.trust(marked.parse(vnode.state.markdown)))
            ]);
        }
  };
}
