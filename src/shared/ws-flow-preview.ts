import m from 'mithril';
import { _events, dispatch } from './utils';
import { MarkdownRenderer } from './ws-marked'
import { syntaxHighlighter } from './ws-hljs';
import { githubSvg } from './ws-svg';
import { TagsInput } from './ws-flow-tag-input';

export function FlowPreview(): m.Component {
    const marked = new MarkdownRenderer({ enableSanitizer: false });

    return {
        oninit(vnode) {
            vnode.state.flow = globalThis.flowService.flow;
            vnode.state.markdown = globalThis.flowService.markdown || '';
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
            const gitInfoAvailable = vnode.state.flow.git_repo_root || vnode.state.flow.git_branch || vnode.state.flow.git_commit_sha;
            return m('.p-4', [
                gitInfoAvailable && m('.flex mb-4 p-4 bg-base-200 rounded-lg items-center', [
                    m('.text-sm font-semibold text-base-content', m.trust(githubSvg)),
                    m('.flex gap-1 text-sm', [
                        vnode.state.flow.git_repo_root && m('.flex items-center gap-2 ml-2', [
                            m('span.font-medium', 'Repository:'),
                            m('span.text-base-content/70', vnode.state.flow.git_repo_root)
                        ]),
                        vnode.state.flow.git_branch && m('.flex items-center gap-2', [
                            m('span.ml-6 font-medium', 'Branch:'),
                            m('span.text-base-content/70', vnode.state.flow.git_branch)
                        ]),
                        vnode.state.flow.git_commit_sha && m('.flex items-center gap-2', [
                            m('span.ml-6 font-medium', 'Commit:'),
                            m('code.text-xs text-base-content/70', vnode.state.flow.git_commit_sha)
                        ])
                    ])
                ]),
                m(TagsInput, { flow: vnode.state.flow, enableCrud: false }),
                m('.prose max-w-none', m.trust(marked.parse(vnode.state.markdown)))
            ]);
        }
  };
}
