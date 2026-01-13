import m from 'mithril';
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
            const gitInfoAvailable = vnode.state.flow.git_repo_root || vnode.state.flow.git_branch || vnode.state.flow.git_commit_sha;
            const gitInfoString = [
                vnode.state.flow.git_repo_root ? `<strong class="inline-flex gap-2 items-baseline"><span>${githubSvg}</span> Repo:</strong> ${vnode.state.flow.git_repo_root}` : null,
                vnode.state.flow.git_branch ? `<strong>Branch:</strong> ${vnode.state.flow.git_branch}` : null,
                vnode.state.flow.git_commit_sha ? `<strong>Commit:</strong> ${vnode.state.flow.git_commit_sha}` : null,
            ].filter(Boolean).join(' ');
            
            
            return m('.p-2 sm:p-4', [
                gitInfoAvailable && m('p.mb-4 p-4 bg-base-200 rounded-lg gap-2 truncate overflow-hidden', [
                    m.trust(gitInfoString),                    
                ]),
                m(TagsInput, { flow: vnode.state.flow, enableCrud: false }),
                m('.prose max-w-none', m.trust(marked.parse(vnode.state.markdown)))
            ]);
        }
  };
}
