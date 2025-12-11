import m from 'mithril'
import { Flow } from './ws-flow-page'
import { FlowList } from './ws-flow-list-page'
import './style.css'

const Logo = 
  m(m.route.Link, {href: "/"},
    m('.text-xl md:text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors duration-200',
      m('span.bg-black text-white px-2 md:px-3 py-1 border-2 border-black shadow-lg transform hover:scale-105 transition-transform duration-200 font-mono tracking-wider text-sm md:text-base', 
        'WAYSTATION'
  )))

const Layout = {
  view: (vnode) => {
    return (
    m('main.layout', [
      m('nav.fixed top-0 left-0 right-0 bg-white shadow-md z-50 border-b border-gray-200', [
        m('.container mx-auto px-5', 
          m('.flex justify-between items-center h-16',
            [
              Logo,
              m(m.route.Link, {href: "/", class: "btn btn-ghost"}, "Flows")
            ]
          ))
      ]),
      m("section.mt-28", vnode.children)
      //end
    ]))
  }
}

const L = (child) => {
  return {
    render(vnode){
      return m(Layout, m(child, vnode.attrs))
    }
  }
}

m.route(document.body, '/', {
  '/': L(FlowList),
  '/flow/:id': L(Flow)
})