import m from 'mithril'
import { _events, dispatch } from '../shared/utils'
import { FlowList } from '../shared/ws-flows-list'

enum TabRoute {
  Public = 'public',
  UserFlows = 'user-flows',
  UserPublicFlows = 'user-public-flows'
}

export const Page: m.Component = {
  activeTab: TabRoute.MyFlows,

  oninit() {
    this.onupdate()
  },
  onupdate() {
    // Update activeTab based on current route
    const route = m.route.get();
    if (route === '/public') {
      this.activeTab = TabRoute.Public;
    } else if (route === '/') {
      this.activeTab = TabRoute.UserFlows;
    } else {
      this.activeTab = TabRoute.UserPublicFlows;
    }
  },
  view() {
    const isLoggedIn = globalThis.authService?.loggedIn;
    return m('.container mx-auto p-2 sm:p-4',
      [
        m('.tabs tabs-boxed mb-4',
          [
            // Only show "My Flows" tab if user is logged in
            isLoggedIn && m('button.tab', {
              class: this.activeTab === TabRoute.UserFlows ? 'tab-active' : '',
              onclick: () => {
                m.route.set('/');
              }
            }, 'My Flows'),
            m('button.tab', {
              class: this.activeTab === TabRoute.Public ? 'tab-active' : '',
              onclick: () => {
                m.route.set('/public');
              }
            }, 'Public'),
            ([TabRoute.UserPublicFlows, TabRoute.Public].includes(this.activeTab) && isLoggedIn)
              && m('button.tab', {
                class: this.activeTab === TabRoute.UserPublicFlows ? 'tab-active' : '',
                onclick: () => {
                  m.route.set(m.buildPathname('/public/:user_id', { user_id: globalThis.authService.user?.id }));
                }
              }, '=|| Just mine')
          ]
        ),
        m(FlowList, {activeTab: this.activeTab}),
      ]
    )
  }
}