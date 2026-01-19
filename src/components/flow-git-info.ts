import m from 'mithril';
import { githubSvg } from '../shared/ws-svg';

export function FlowGitInfo(){
    return {
        view(vnode) {
            const flow = vnode.attrs.flow;
            const gitInfoAvailable = flow.git_repo_root || flow.git_branch || flow.git_commit_sha;

            if (!gitInfoAvailable) {
                return null;
            }

            return m('p.mb-4 space-x-2 truncate overflow-hidden', [
                flow.git_repo_root 
                    ? m(m.route.Link, {
                        class: 'text-sm inline-flex items-baseline gap-1 link link-secondary',
                        href: '/',
                        params: { repo: flow.git_repo_root  }
                    }, [m.trust(githubSvg), m('span', flow.git_repo_root)])
                    : null,
                flow.git_branch && m('span.text-sm inline-flex items-baseline gap-1', [
                    m('span', 'Branch: '),
                    m('strong', flow.git_branch)
                ]),
                flow.git_commit_sha && m('span.text-sm inline-flex items-baseline gap-1', [
                    m('span', 'Commit: '),
                    m('strong', flow.git_commit_sha)
                ])                  
            ]);
        }
    };
}