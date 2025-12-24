import m from 'mithril'
import { _events, dispatch } from '../shared/utils'
import { FlowList } from '@waystation/shared/ws-flows-list'

export const Page: m.Component = {
  activeTab: 'my-flows',

  oninit() {
    // Initial load
    dispatch(_events.action.refreshList, {});
  },

  view() {
    return m('.container mx-auto p-4',
      [
        m('.tabs tabs-boxed mb-4',
          [
            m('button.tab', {
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
            }, 'Public')
          ]
        ),
        m(FlowList)
      ]
    )
  }
}