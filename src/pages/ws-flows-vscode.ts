import m from 'mithril'
import { _events } from '../shared/utils'
import { FlowList } from '../shared/ws-flows-list'

enum TabRoute {
  Repo = 'repo',
  All = 'user-flows',
}

export const Page: m.Component = {
  activeTab: TabRoute.Repo,

  oninit(vnode) {
    if(globalThis.__INITIAL_DATA__) {
      vnode.state.repo = globalThis.__INITIAL_DATA__.repo
    }

    this.onbeforeupdate(vnode)
  },
  onbeforeupdate(vnode) {
    // Update activeTab based on current route
    const route = m.route.get();
    if (vnode.state.repo && route.includes('repo')) {
      this.activeTab = TabRoute.Repo;
    } else {
      this.activeTab = TabRoute.All;
    }
  },
  view(vnode) {
    const isLoggedIn = globalThis.authService?.loggedIn;
    return m('.container mx-auto',
      [
        m('.tabs tabs-boxed mb-4',
          [
            // Only show "My Flows" tab if user is logged in
            isLoggedIn && m('button.tab', {
              class: this.activeTab === TabRoute.Repo ? 'tab-active' : '',
              onclick: () => {
                m.route.set('/', { repo: vnode.state.repo } );
              }
            }, 'This Repo'),
            m('button.tab', {
              class: this.activeTab === TabRoute.All ? 'tab-active' : '',
              onclick: () => {
                m.route.set('/');
              }
            }, 'All Flows')
          ]
        ),
        m(FlowList, {activeTab: this.activeTab}),
      ]
    )
  }
}