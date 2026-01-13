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
            return m('.p-2 sm:p-4', [
                gitInfoAvailable && m('.flex flex-col sm:flex-row mb-4 p-4 bg-base-200 rounded-lg sm:items-center gap-2 sm:gap-0', [
                    m('.text-sm font-semibold text-base-content', m.trust(githubSvg)),
                    m('.flex flex-col sm:flex-row gap-2 sm:gap-1 text-sm', [
                        vnode.state.flow.git_repo_root && m('.flex items-center gap-2 sm:ml-2', [
                            m('span.font-medium', 'Repository:'),
                            m('span.text-base-content/70', vnode.state.flow.git_repo_root)
                        ]),
                        vnode.state.flow.git_branch && m('.flex items-center gap-2 sm:ml-6', [
                            m('span.font-medium', 'Branch:'),
                            m('span.text-base-content/70', vnode.state.flow.git_branch)
                        ]),
                        vnode.state.flow.git_commit_sha && m('.hidden sm:flex items-center gap-2 sm:ml-6', [
                            m('span.font-medium', 'Commit:'),
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
