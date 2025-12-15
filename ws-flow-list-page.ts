import m from 'mithril'

const _events = {
  action: {
    refreshList: 'ws::action::refreshList',
    requestFlow: 'ws::action::requestFlow',
  },
};

function dispatch(eventName, data) {
  return globalThis.dispatchEvent(
    new CustomEvent(eventName, { detail: data || {} })
  );
}

class FlowListService {
  _flows = []
  
  get flows(){
    return this._flows;  
  }
  
  load(flows){
   this._flows = flows;
   m.redraw()
  }
}

globalThis.flowListService = new FlowListService();

function FlowDescriptionMd(){
  let description = '';
  return {
    oninit(vnode){
      if(vnode.attrs.description)
        description = globalThis.marked.parse(vnode.attrs.description)
    },
    view(){
      return m('.text-sm text-base-content/70 line-clamp-3', m.trust(description))
    } 
  }
}

const FlowCard = {
  view(vnode){
    const description = vnode.attrs.flow.description || ''
    const children = [
      m('.card-title text-lg font-semibold text-primary', vnode.attrs.flow.name || ''),
      description && m(FlowDescriptionMd, { description }),
      m('.flex-1'),
      m('.card-actions justify-between',
        [
          m('.text-sm', `Created ${vnode.attrs.flow.updated_at}`), 
          m('button.btn btn-sm btn-ghost', '> View')
        ])
    ]
    return m('.card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300 border border-base-300 h-full', 
      m('.card-body', children)
    )
  }
}

export const FlowList = {
  oninit(){
    // Load initial data if available
    if (globalThis.__INITIAL_DATA__?.flows) {
      globalThis.flowListService.load(globalThis.__INITIAL_DATA__.flows);
    }
    dispatch(_events.action.refreshList, {});
  },
  view(){
    return (
    m('.container mx-auto p-4', 
      m('ul.grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3', 
        globalThis.flowListService.flows.map(flow => {
          return (
          m('li.list-none', 
            m(m.route.Link, { 
              href: '/flow/' + flow.id,
              class: 'no-underline hover:no-underline block h-full',
              onclick: () => {
                dispatch(_events.action.requestFlow, { flowId: flow.id })
              }
            }, [
              m(FlowCard, { 
                flow
              })
            ])
          )
        )})
      )
    ))
  } 
}