import m from 'mithril'
import { MarkdownRenderer } from './ws-marked'
import { SyntaxHighlighter } from './ws-hljs'

function dispatch(eventName, data){
 return globalThis.dispatchEvent(new CustomEvent(eventName, { detail: data || {} }));
}

const _events = {
  action: {
    prompt: 'ws::action::prompt',
    editFlow: 'ws::action:editFlow',
    export: 'ws::action::export'
  }
}

class FlowService {
  _flow = {
    flow: {},
    matches: []
  }
  
  get flow(){
    return this._flow?.flow || {};
  }
  
  get matches(){
    return this._flow?.matches || []
  }
  
  loadFlow(flow){
    if(flow.hasOwnProperty('flow') && flow.hasOwnProperty('matches')){
      this._flow = flow;
      m.redraw()
    }
    else {
      throw `Incorrect object properties: ${Object.keys(flow)}`
    }
  }
}

globalThis.flowService = new FlowService();
globalThis.marked = new MarkdownRenderer();
globalThis.syntaxHighlighter = new SyntaxHighlighter()
const FlowToolbar = {
  view(){
    return m('ul.flow-toolbar.flex flex-wrap gap-2 mb-6', [
      m('button.btn btn-sm btn-primary', { 
        onclick: () => { dispatch(_events.action.prompt, globalThis.flowService) }
      }, 'Prompt'),
      m('button.btn btn-sm btn-outline', { 
        onclick: () => { dispatch(_events.action.editFlow, globalThis.flowService) }
      }, 'Edit'),
      m('button.btn btn-sm btn-outline', { 
        onclick: () => { dispatch(_events.action.export, globalThis.flowService) }
      }, 'Export'),
    ])
  }
}

const FlowMatchToolbar = {
  view(){
    return m('ul.match-toolbar.flex flex-wrap gap-2 mb-4', [
      m('button.btn btn-xs btn-ghost', { 
        onclick: () => { dispatch(_events.action.prompt, globalThis.flowService) }
      }, 'Up'),
      m('button.btn btn-xs btn-ghost', { 
        onclick: () => { dispatch(_events.action.prompt, globalThis.flowService) }
      }, 'Down'),
      m('button.btn btn-xs btn-outline', { 
        onclick: () => { dispatch(_events.action.prompt, globalThis.flowService) }
      }, 'Generate'),
      m('button.btn btn-xs btn-outline', { 
        onclick: () => { dispatch(_events.action.prompt, globalThis.flowService) }
      }, 'Edit'),
      m('button.btn btn-xs btn-outline btn-error', { 
        onclick: () => { dispatch(_events.action.editFlow, globalThis.flowService) }
      }, 'Delete'),
      m('button.btn btn-xs btn-success', { 
        onclick: () => { dispatch(_events.action.export, globalThis.flowService) }
      }, 'Add Child'),
    ])
  }
}

function FlowMatchCodeBlock(){
  let code = ''
  let language = ''
  return {
    oninit(vnode){
      const match = vnode.attrs.match.match
      const meta = JSON.parse(match.grep_meta)
      const lines = meta.context_lines.join('\n')
      language = globalThis.syntaxHighlighter.pathExtension(match.file_name)
      code = globalThis.syntaxHighlighter.highlightCode(lines, language)
    },
    view(){
      return (
        m('.code.card bg-base-200 mt-4', 
          m('.card-body p-4', 
            m('pre.overflow-x-auto', 
              m('code', { classes: `language-${language}` }, 
                m.trust(code)
              )
            )
          )
        )
      )
    },
  }
}

function FlowDescriptionMd(){
  let description = '';
  return {
    oninit(vnode){
      if(vnode.attrs.description)
        description = globalThis.marked.parse(vnode.attrs.description)
    },
    view(){
      return m('.text-base text-base-content/70 mt-2', m.trust(description))
    } 
  }
}

const FlowMatchList = {
  view(){
    return globalThis.flowService.matches.map((match, index) => {
      return m(FlowMatch, { match, index })
    })
  }
}

const FlowMatch = {
  _title(match){
    const maybeNote = match.note?.name
    const maybeContent = match.step_content?.title
    return maybeNote || maybeContent || ''
  },
  _description(match){
    const maybeNote = match.note?.description
    const maybeContent = match.step_content?.body
    return maybeNote || maybeContent || ''
  },
  view(vnode){
    const match = vnode.attrs.match;
    const description = this._description(match)
    const children = [
      m('.toolbar-wrapper', m(FlowMatchToolbar)),
      m('h2.text-lg font-semibold text-primary', this._title(match))
    ]
    description && children.push(m(FlowMatchDescriptionMd, { description }))
    match.content_kind === 'match' && children.push(m(FlowMatchCodeBlock, { match }))
    return m('.match.card bg-base-100 shadow-md border border-base-300 mb-6', 
      m('.card-body', children)
    )
  }
}

const FlowMatchDescriptionMd = FlowDescriptionMd
const FlowInsertBetween = {}

export function Flow(){
  let title = '';
  let description = '';
  return {
    oninit(){
      title = globalThis.flowService.flow.name
      description = globalThis.flowService.flow.description
    },
    view(){
      return m('.flow.container mx-auto p-4 max-w-5xl', [
        m('.toolbar-wrapper', m(FlowToolbar)),
        m('h1.text-2xl font-bold text-base-content mb-4', title),
        description && m(FlowDescriptionMd, { description }),
        m('.mt-8', 
          m('h2.text-xl font-semibold mb-4', 'Matches'),
          m(FlowMatchList)
        )
      ])
    } 
  }
}