import m from "mithril";
import { TagsList } from "../pages/ws-tags-list";
import { ThemePicker } from "./ws-theme-picker";
import { dispatch, _events } from "./utils";

const Logo = m(
  m.route.Link,
  { href: "/" },
  m(
    ".text-xl md:text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors duration-200",
    m(
      "span.bg-black text-white px-2 md:px-3 py-1 border-2 border-black shadow-lg transform hover:scale-105 transition-transform duration-200 font-mono tracking-wider text-sm md:text-base",
      "WAYSTATION"
    )
  )
);

export const Layout = {
  oninit(vnode) {
    vnode.state.menuOpen = false;
    vnode.state.drawerOpen = false;
    this.onbeforeupdate(vnode);
  },
  onbeforeupdate(vnode) {
    vnode.state.loggedIn = globalThis.authService.loggedIn;
  },
  view: (vnode) => {
    return m(".drawer", [
      m("input#main-drawer", {
        type: "checkbox",
        class: "drawer-toggle",
        checked: vnode.state.drawerOpen,
        onchange: (e) => {
          vnode.state.drawerOpen = e.target.checked;
        }
      }),
      m(".drawer-content", [
        m("main.layout container mx-auto", [
          m(".navbar items-center px-3 md:px-6", [
            m(".navbar-start flex-1 gap-2", [
              Logo,
              m("label.btn.btn-ghost.btn-circle.hidden.md:flex", {
                for: "main-drawer",
                "aria-label": "Open main drawer"
              }, m("svg.h-6.w-6", {
                xmlns: "http://www.w3.org/2000/svg",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor"
              }, m("path", {
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                "stroke-width": "2",
                d: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              })))
            ]),
            m(".navbar-end gap-2", [
              m("label.btn.btn-ghost.btn-circle.md:hidden", {
                for: "main-drawer",
                "aria-label": "Open menu"
              }, m("svg.h-6.w-6", {
                xmlns: "http://www.w3.org/2000/svg",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor"
              }, m("path", {
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                "stroke-width": "2",
                d: "M4 6h16M4 12h16M4 18h16"
              }))),
              m(".hidden md:flex items-center gap-2", [
                m(
                  "button.btn btn-ghost",
                  {
                    onclick: () => {
                      if (vnode.state.loggedIn) {
                        m.route.set("/flow/new");
                      } else {
                        m.route.set("/auth");
                      }
                    },
                  },
                  "New Flow"
                ),
                m(m.route.Link, { href: "/", class: "btn btn-ghost" }, "Flows"),
                !vnode.state.loggedIn &&
                  m(
                    m.route.Link,
                    { href: "/auth", class: "btn btn-ghost" },
                    "Login"
                  ),
                vnode.state.loggedIn &&
                  m(
                    "button.btn btn-ghost",
                    { onclick: () => dispatch(_events.auth.logout) },
                    "Logout"
                  ),
              ]),
              m(".hidden md:block ml-1 md:ml-3", m(ThemePicker)),
            ]),
          ]),
          m("section.mt-3 sm:mt-5 md:mt-7 p-2 sm:p-4", vnode.children),
          //end
        ]),
      ]),
      m(".drawer-side", {class: ' z-[101]'}, [
        m("label.drawer-overlay", {
          for: "main-drawer",
          "aria-label": "close sidebar"
        }),
        m(".bg-base-200 text-base-content min-h-full w-80 p-2 sm:p-4 flex flex-col", [
          m(".flex.justify-between items-center mb-4", [
            Logo,
            m("label.btn btn-circle btn-ghost lg:hidden", {
              for: "main-drawer"
            }, "✕")
          ]),
          m(".menu menu-vertical mb-4 w-full space-y-1 sm:space-y-2", [
            m(
              "li",
              m(
                "button.btn btn-outline",
                {
                  onclick: () => {
                    m.route.set("/flow/new");
                    vnode.state.drawerOpen = false;
                  },
                },
                "New Flow"
              )
            ),
            m(
              "li",
              m(
                m.route.Link,
                {
                  class: "btn btn-outline",
                  href: "/",
                  onclick: () => {
                    vnode.state.drawerOpen = false;
                  },
                },
                "Flows"
              )
            ),
            !vnode.state.loggedIn &&
              m(
                "li",
                m(
                  m.route.Link,
                  {
                    class: "btn btn-outline",
                    href: "/auth",
                    onclick: () => {
                      vnode.state.drawerOpen = false;
                    },
                  },
                  "Login"
                )
              ),
            vnode.state.loggedIn &&
              m(
                "li",
                m(
                  "button.btn btn-outline btn-error",
                  {

                    onclick: () => {
                      dispatch(_events.auth.logout);
                      vnode.state.drawerOpen = false;
                    },
                  },
                  "Logout"
                )
              ),
          ]),
          m(".flex-1", m(TagsList)),
          m(".mt-4.md:hidden.flex.justify-center", m(ThemePicker))
        ])
      ])
    ]);
  },
};