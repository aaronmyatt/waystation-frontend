import { MarkdownRenderer } from './ws-marked'
import m from 'mithril'
import { _events as _sharedEvents, dispatch } from './utils'
import { cogSvg, copySvg } from './ws-svg';
import { FlowSettingsModal } from './ws-flow-settings-modal';

const marked = new MarkdownRenderer();

function FlowDescriptionMd(){
  return {
    oninit(vnode){
        vnode.state.description = marked.parse(vnode.attrs.description || '')
    },
    onbeforeupdate(vnode){
      if(vnode.attrs.description !== vnode.state.description){
        vnode.state.description = marked.parse(vnode.attrs.description || '')
      }
    },
    view(vnode){
      return m('.text-sm text-base-content/70 line-clamp-3', m.trust(vnode.state.description))
    } 
  }
}

const FlowCard = {
  oninit(vnode){
    vnode.state.settingsModalEnabled = (
      globalThis.featureToggleService.isEnabled('settings-modal') && globalThis.flowService.canEdit(vnode.attrs.flow)
    );
  },
  view(vnode){
    return m('.card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300 border border-base-300 h-full', 
      m('.card-body', [
        m('.card-title text-lg font-semibold text-primary justify-between', [
          m('span', vnode.attrs.flow.name || ''),
          m('.flex gap-1', [
            m('button.btn btn-circle btn-sm btn-ghost', {
              onclick: (e: Event) => {
                e.stopPropagation();
                e.preventDefault();
                dispatch(_sharedEvents.flow.copyFlow, { flow: vnode.attrs.flow });
              },
              'aria-label': 'Copy flow'
            }, m.trust(copySvg)),
            vnode.state.settingsModalEnabled && m('button.btn btn-circle btn-sm', {
              onclick: (e: Event) => {
                e.stopPropagation();
                e.preventDefault();
                dispatch(_sharedEvents.ui.openFlowSettingsModal, { flowId: vnode.attrs.flow.id });
              }
            }, m.trust(cogSvg))
          ])
        ]),
        m(FlowDescriptionMd, { description: vnode.attrs.flow.description }),
        m('.flex-1'),
        m('.card-actions justify-between',
          [
            m('.text-sm', `Created ${vnode.attrs.flow.updated_at}`), 
            m('button.btn btn-sm btn-ghost', 'View >'),
          ])
      ])
    )
  }
}

export const FlowList: m.Component = {
  view(vnode){
    if (globalThis.flowListService.flows.length === 0) {
      return m('.container mx-auto p-4', m('p.text-center text-lg text-base-content/70', 'No flows found.'));
    } else {
      return (
      m('.container mx-auto p-4', [
        m('.', 
          globalThis.flowListService.groupByDate().map(([date, flows]) => {
            return [
              m('h2.text-xl font-bold text-base-content my-4 col-span-full', date),
              m('ul.grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',               
                flows.map(flow =>
                  m('li.list-none',
                    { key: flow.id },
                    m(m.route.Link, { 
                      href: vnode.attrs.activeTab === 'public' ? '/public_flows/' + flow.id : '/flow/' + flow.id,
                      class: 'no-underline hover:no-underline block h-full',
                    }, [
                      m(FlowCard, { 
                        flow
                      })
                    ])
                  )
              ))
            ];
          }
          )),
          m(FlowSettingsModal)
        ])
      );
    }
  } 
}