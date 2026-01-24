import { MarkdownRenderer } from './ws-marked'
import m from 'mithril'
import { _events as _sharedEvents, dispatch, debounce } from './utils'
import { cogSvg, copySvg, searchSvg } from './ws-svg';
import { FlowSettingsModal } from './ws-flow-settings-modal';
import { formatDistanceToNow } from 'date-fns';

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

export const FlowCard = {
  oninit(vnode){
    vnode.state.settingsModalEnabled = vnode.attrs.settingsModalEnabled
    
    if(vnode.state.settingsModalEnabled === undefined){
      vnode.state.settingsModalEnabled = globalThis.featureToggleService.isEnabled('settings-modal') && globalThis.flowService.canEdit(vnode.attrs.flow);
    }
  },
  view(vnode){
    return m('.card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300 border border-base-300 h-full', 
      m('.card-body', [
        m('.card-title text-lg font-semibold text-primary justify-between', [
          m('span', vnode.attrs.flow.name || ''),
          m('.flex gap-1', [
            m('button.btn btn-ghost btn-primary btn-circle btn-sm', {
              onclick: (e: Event) => {
                e.stopPropagation();
                e.preventDefault();
                dispatch(_sharedEvents.flow.copyFlow, { flow: vnode.attrs.flow });
              },
              'aria-label': 'Copy flow'
            }, m.trust(copySvg)),
            vnode.state.settingsModalEnabled && m('button.btn btn-ghost btn-primary btn-circle btn-sm', {
              onclick: (e: Event) => {
                e.stopPropagation();
                e.preventDefault();
                dispatch(_sharedEvents.ui.openFlowSettingsModal, { flow: vnode.attrs.flow });
              }
            }, m.trust(cogSvg))
          ])
        ]),
        m(FlowDescriptionMd, { description: vnode.attrs.flow.description }),
        m('.flex-1'),
        m('.card-actions justify-between items-center',
          [
            m('.text-sm', `${formatDistanceToNow(new Date(vnode.attrs.flow.updated_at), { addSuffix: true })}`), 
            m('button.btn btn-sm', 'Open'),
          ])
      ])
    )
  }
}

const SearchInput: m.Component = {
  oninit(vnode) {
    // Get initial search value from URL
    const params = m.route.param();
    vnode.state.searchValue = params.query || '';
    
    // Create debounced search function
    vnode.state.debouncedSearch = debounce((value: string) => {
      const params = m.route.param()
      m.route.set(m.route.get().replace(/\?.*$/, ''), { ...params, query: value });
    }, 300);
  },
  onupdate(vnode) {
    // Sync search input with URL parameter
    const params = m.route.param();
    if (params.query !== vnode.state.searchValue) {
      vnode.state.searchValue = params.query || '';
    }
  },
  view(vnode) {
    return m('.flex', m('label.input input-ghost flex items-center gap-2 mb-4 grow', [
      m.trust(searchSvg),
      m('input[type=text][placeholder=Search flows...]', {
        class: 'grow',
        value: vnode.state.searchValue,
        oninput: (e: Event) => {
          const target = e.target as HTMLInputElement;
          vnode.state.searchValue = target.value;
          vnode.state.debouncedSearch(target.value);
        }
      })
    ]));
  }
};

export const FlowList: m.Component = {
  view(vnode){
    if (globalThis.flowListService.flows.length === 0) {
      return m('.container mx-auto py-2 px-1 sm:p-4', m('p.text-center text-lg text-base-content/70', 'No flows found.'));
    } else {
      return (
      m('.container mx-auto', [
        m(SearchInput),
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