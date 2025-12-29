import m from 'mithril'
import { _events, dispatch } from '../shared/utils'
import { FlowList } from '../shared/ws-flows-list'
import { FlowSettingsModal } from '../shared/ws-flow-settings-modal';

export const Page: m.Component = {
  activeTab: 'my-flows',

  oninit() {
    // Set default tab based on login status
    const isLoggedIn = globalThis.authService?.loggedIn;
    this.activeTab = isLoggedIn ? 'my-flows' : 'public';

    // Initial load with appropriate filter
    if (isLoggedIn) {
      dispatch(_events.action.refreshList, {});
    } else {
      dispatch(_events.action.refreshList, { filter: 'public' });
    }
  },

  view() {
    const isLoggedIn = globalThis.authService?.loggedIn;
    return m('.container mx-auto p-4',
      [
        m('.tabs tabs-boxed mb-4',
          [
            // Only show "My Flows" tab if user is logged in
            isLoggedIn && m('button.tab', {
              class: this.activeTab === 'my-flows' ? 'tab-active' : '',
              onclick: () => {
                this.activeTab = 'my-flows';
                dispatch(_events.action.refreshList, {});
              }
            }, 'My Flows'),
            m('button.tab', {
              class: this.activeTab === 'public' ? 'tab-active' : '',
              onclick: () => {
                this.activeTab = 'public';
                dispatch(_events.action.refreshList, { filter: 'public' });
              }
            }, 'Public'),
            (this.activeTab === 'public' && isLoggedIn)
              && m('button.tab', {
                onclick: () => {
                  dispatch(_events.action.refreshList, { filter: 'public', username: globalThis.authService.user?.username });
                }
              }, '=|| Just mine')
          ]
        ),
        m(FlowList, {activeTab: this.activeTab}),
      ]
    )
  }
}