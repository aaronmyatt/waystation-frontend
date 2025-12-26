import m from "mithril";
import { upSvg, downSvg, verticalDotsSvg, plusSvg, chevronDownSvg, chevronUpSvg } from "../shared/ws-svg";
import { dispatch, _events } from "../shared/utils";
import { OvertypeBase } from "../shared/ws-overtype";
import { CodeBlock, CodeLine } from "../shared/ws-hljs";

let skipRederaw = false;

const FlowToolbar = {
  view() {
    return m("ul.flow-toolbar flex flex-wrap gap-2", [
      m(
        "button.btn btn-sm btn-outline hidden sm:inline-flex",
        {
          onclick: () => dispatch(_events.action.export, {flow: { ...globalThis.flowService.flow }})
        },
        "Export"
      ),
      m(
        ".dropdown dropdown-end",
        m(
          ".btn sm:btn-sm btn-ghost text-primary",
          { tabIndex: 0 },
          m("span.block size-4 text-primary", m.trust(verticalDotsSvg))
        ),
        m(
          "ul.menu dropdown-content bg-base-200 rounded-box z-10 w-52 shadow-sm",
          { tabIndex: -1 },
          [
            m("li",
              m("a",
                {
                  onclick: (e) => dispatch(_events.action.export, {flow: { ...globalThis.flowService.flow }})
                },
                "Export"
              )
            ),
            m("li",
              m("a",
                {
                  onclick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dispatch(
                      _events.action.generateFlowContent,
                      {flow: { ...globalThis.flowService.flow }}
                    );
                  },
                },
                "Generate Description"
              )
            ),
            m("li",
              m("a.text-error",
                {
                  onclick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dispatch(
                      _events.action.deleteFlow,
                      {flow: { ...globalThis.flowService.flow }}
                    );
                    m.route.set("/");
                  },
                },
                "Delete Flow"
              )
            )
          ]
        ),
        
      ),
    ]);
  },
};

const FlowMatchToolbar = {
  view(vnode) {
    return m(
      "ul.match-toolbar.flex flex-wrap gap-1 sm:gap-2",
      {
        onclick: (e) => {
          e.stopPropagation();
        },
      },
      [
        m(
          "button.btn btn-xs btn-ghost",
          {
            class: vnode.attrs.match.order_index === 0 ? "btn-disabled bg-neutral-content" : "",
            onclick: (e) => {
              globalThis.flowService.moveFlowMatchUp(vnode.attrs.match);
            },
          },
          m("span.text-primary block size-4", m.trust(upSvg))
        ),
        m(
          "button.btn btn-xs btn-ghost",
          {
            class: vnode.attrs.match.order_index === globalThis.flowService.matches.length - 1 ? "btn-disabled bg-neutral-content" : "",
            onclick: (e) => {
              globalThis.flowService.moveFlowMatchDown(vnode.attrs.match);
            },
          },
          m("span.text-primary block size-4", m.trust(downSvg))
        ),

        m(
          "button.btn btn-xs btn-outline hidden sm:inline-flex",
          {
            onclick: (e) => {
              vnode.attrs.editCb && vnode.attrs.editCb(e);
            },
          },
          vnode.attrs.editing ? "Save" : "Edit"
        ),
        m(
          "details.dropdown dropdown-end",
          m(
            "summary.btn btn-xs btn-ghost text-primary",
            m("span.block size-4 text-primary", m.trust(verticalDotsSvg))
          ),
          m(
            "ul.menu dropdown-content bg-base-200 rounded-box w-52 p-2 shadow-sm",
            [
              m("li",
                m("a",
                  {
                    class: "sm:hidden",
                    onclick: (e) => {
                      vnode.attrs.editCb && vnode.attrs.editCb(e);
                    },
                  },
                  vnode.attrs.editing ? "Save" : "Edit"
                )
              ),
              m("li",
                [m("a",
                  {
                    onclick: () => {
                      dispatch(_events.dialog.openInsertBetween, {
                        ...vnode.attrs
                      })
                    },
                  },
                  "Insert After"
                ),
              ]
              ),
              m("li",
                m("a",
                  {
                    onclick: (e) => {
                      dispatch(_events.action.createChildFlow, {
                        flowMatch: { ...vnode.attrs.match },
                      });
                    },
                  },
                  "Create Child Flow"
                )
              ),
              m("li",
                m("a",
                  {
                    onclick: (e) => {
                      dispatch(_events.action.generateFlowMatchContent, {
                        flowMatch: vnode.attrs.match,
                      });
                    },
                  },
                  "Generate Description"
                )
              ),
              m("li",
                m("a.text-error",
                  {
                    onclick: (e) => {
                      globalThis.flowService.deleteFlowMatch(vnode.attrs.match);
                    },
                  },
                  "Delete Match"
                )
              )
          ])
        ),
      ]
    );
  },
};

function FlowMatchList() {
  return {
    view(vnode) {
      return m(
        "div.match-list",
        vnode.attrs.matches
          .toSorted((a, b) => a.order_index - b.order_index)
          .map(function (match, index) {
            return m(FlowMatch, {
              match,
              index,
              key: `${match.order_index}-${match.flow_match_id}`,
            });
          })
      );
    },
  };
}

function FlowMatch() {
  let editing = false;
  let title = "";
  let description = "";
  let open = true;
  return {
    oninit(vnode) {
      title =
        vnode.attrs.match.note?.name ||
        vnode.attrs.match.step_content?.title ||
        "";

      description =
        vnode.attrs.match.note?.description ||
        vnode.attrs.match.step_content?.body ||
        "";

      if( window.innerWidth < 680 ){
        open = false;
      }

      // register resize listener to handle collapse state
      window.addEventListener('resize', () => {
        if( window.innerWidth < 680 ){
          open = false;
        } else {
          open = true;
        }
        m.redraw();
      });
    },
    onremove(){
      window.removeEventListener('resize', () => {});
    },
    view(vnode) {
      return m.fragment([
        m(
          // peer: allows the next sibling to style itself based on this element's hover state
          ".match card card-xs sm:card-md p-1 bg-base-100 shadow-md border border-base-300 peer mb-2 sm:mb-0",
          {
            class:
              "hover:shadow-lg hover:border-primary transition-shadow duration-300 cursor-pointer",
            onclick: (e) => {
              skipRederaw = true;
              dispatch(_events.action.clickFlowMatch, {  flowMatch: { ...vnode.attrs.match }  });
            },
          },
          // NOTE: previous overflow-hidden, why?
          m(".card-body gap-0 space-y-2 sm:gap-2", [
            // title & toolbar
            m(".flex justify-between items-baseline gap-1 sm:gap-4", [
              editing
                ? m(
                    "h2.card-title text-lg font-semibold text-secondary min-w-0 flex-grow",
                    {
                      onclick: (e) => {
                        e.stopPropagation();
                      },
                    },
                    m(TitleInput, {
                      title: title,
                      cb: (newTitle) => {
                        title = newTitle;
                      },
                    })
                  )
                : m(
                    "h2.card-title text-lg font-semibold text-secondary min-w-0 flex-grow",
                    { 
                      style: "overflow-wrap: anywhere; word-break: break-word;"
                    },
                    title
                  ),
              m(
                ".btn btn-xs btn-circle flex-shrink-0 sm:hidden",
                { onclick: (e) => { 
                    e.stopPropagation(); 
                    open = !open;
                  } 
                },
                [m("span.block size-4 text-primary", open ? m.trust(chevronDownSvg) : m.trust(chevronUpSvg))]
              ),
              m(
                ".toolbar-wrapper flex-shrink-0",
                m(FlowMatchToolbar, {
                  editing,
                  match: vnode.attrs.match,
                  index: vnode.attrs.index,
                  editCb: (e) => {
                    if( editing ){
                      editing = false;
                      // save changes
                      const updatedMatch = { ...vnode.attrs.match };

                      if (updatedMatch.content_kind === "match") {
                        updatedMatch.note = {
                          ...updatedMatch.note,
                          name: title,
                          description: description,
                        };
                      } else if (updatedMatch.content_kind === "note") {
                        updatedMatch.step_content = {
                          ...updatedMatch.step_content,
                          title: title,
                          body: description,
                        };
                      }
                      globalThis.flowService.updateFlowMatch(updatedMatch);
                      // m.redraw();
                    } else {
                      editing = true;
                    }
                  },
                })
              ),
            ]),
            // match.repo_relative_file_path
            vnode.attrs.match.match?.repo_relative_file_path 
              && m(".text-sm link link-primary mb-1", [
                m('span', vnode.attrs.match.match.repo_relative_file_path),
                m('span', {
                  class: "text-base-content/70"
                }, ' +'+vnode.attrs.match.match.line_no),
              ]),
            (!open && vnode.attrs.match.match?.line) 
              && m(".text-sm text-base-content/70 text-nowrap overflow-hidden", m(
              CodeLine, { match: vnode.attrs.match }
            )),
            // Collapsible description on small screens
            m(".collapse", 
              {
                class: open ? "collapse-open" : "collapse-close sm:collapse-open",
              },
              [
                m(".collapse-content p-0", [
                  m(FlowMatchDescriptionEditor, {
                    description,
                    togglePreview: !editing,
                    onKeydown: (e) => { description = e.target.value; }
                  }),
                  vnode.attrs.match.content_kind === "match" && m(CodeBlock, { match: vnode.attrs.match }),
                ])
            ]),
          ])
        ),
        m(FlowMatchInsertBetween, { match: vnode.attrs.match, index: vnode.attrs.index }),
      ]);
    },
  };
}

const InsertBetweenDialog = {
  el: null,
  close() {
    this.el && this.el.close();
  },
  open() {
    this.el && this.el.showModal();
  },
  oninit(vnode) {
    addEventListener(_events.dialog.closeInsertBetween, () => this.close());
    addEventListener(_events.dialog.openInsertBetween, (e) => {
      Object.assign(vnode.state || {}, e.detail);
      this.open() 
    }
  );
  },
  oncreate(vnode){
    this.el = vnode.dom;
  },
  view(vnode) {
    return m('dialog.modal',
        {
          class: vnode.state.showDialog ? 'modal-open' : '',
        },
        m(".modal-box",
          [
            m('form', { method: "dialog" },
              m('button.btn btn-sm btn-circle btn-ghost absolute right-2 top-2', { onclick: this.close }, '✕')
            ),
            m('h4.font-bold', 'Add a Step'),
            m('p.mb-4', 'Would you like to insert a text only note or a match from your editor cursor position/selection?'),
            m('.modal-action',
              [
                m('button.btn btn-primary', {
                  onclick: () => {
                    dispatch(_events.action.insertFlowMatchAfter, { flow: { ...globalThis.flowService.flow }, flowMatch: { ...vnode.state.match }});
                    this.close(); 
                  }
                }, 'Match from cursor'),
                m('button.btn btn-secondary', {
                  onclick: () => {
                    console.log('Adding note step at index', vnode.state.index);
                    globalThis.flowService.addNoteStep(vnode.state.index);
                    this.close();
                  }
                }, 'Add Note')
              ]
            ),
          ]
        ),
        m('form.modal-backdrop', { method: "dialog", onclick: () => { 
          this.close();
        } }, m('button', 'Close'))
      );
  }
}

const FlowMatchInsertBetween = {
  view(vnode) {
    return m(
      ".flex justify-center ",
      {
        // group: allows children to respond to this wrapper's hover state
        // peer-hover:[&>button]:opacity-100: shows button when preceding peer (FlowMatch) is hovered
        class: `hidden sm:block group peer-hover:[&>button]:opacity-100 peer-hover:[&>button]:my-4`,
      },
      m(
        // opacity-0: hidden by default
        // group-hover:opacity-100: shows when hovering over the wrapper itself
        // transition-opacity: smooth fade in/out
        "button.btn btn-sm btn-outline w-full opacity-0 group-hover:opacity-100 group-hover:my-4 transition-opacity",
        {
          onclick: () => {
            dispatch(_events.dialog.openInsertBetween, {
              ...vnode.attrs
            });
          },
        },
        m("span.text-primary block size-4", m.trust(plusSvg))
      ),
    );
  },
};

function FlowDescriptionEditor() {
  return {
    oninit(vnode){
      vnode.state.description = globalThis.flowService.flow.description
    },
    view(vnode) {
      const canEdit = globalThis.flowService?.canEdit();
      return m(
        ".editor",
        m(OvertypeBase, {
          value: globalThis.flowService.flow.description || "",
          placeholder: canEdit ? "Enter description..." : "No description",
          preview: !canEdit,
          onKeydown: (description) => {
            if (!canEdit) return;
            globalThis.flowService.updateFlow({
              ...globalThis.flowService.flow,
              description,
            });
          },
        })
      );
    },
  };
}

function FlowMatchDescriptionEditor() {
  return {
    view(vnode) {
      return m(
        ".editor",
        {
          class: (vnode.attrs.togglePreview && !vnode.attrs.description) ? "hidden" : ""
        },
        [
          m(OvertypeBase, {
            value: vnode.attrs.description,
            preview: vnode.attrs.togglePreview,
            onKeydown: vnode.attrs.onKeydown || (() => {}),
          }),
        ]
      );
    },
  };
}

function TitleInput() {
  let title = "";
  return {
    resize(vnode){
      vnode.dom.style.height = "auto";
      vnode.dom.style.height = vnode.dom.scrollHeight + "px";
    },
    oninit(vnode) {
      this.onbeforeupdate(vnode);
    },
    onbeforeupdate(vnode) {
      if (vnode.attrs.title !== title) {
        title = vnode.attrs.title || "";
      }
    },
    view(vnode){
      return (
        m("textarea.title w-full break-words", {
          value: title,
          name: "flow title",
          readonly: vnode.attrs.readonly || false,
          style: "word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap;",
          oncreate: (vnode) => this.resize(vnode),
          oninput: (e) => {
            if (vnode.attrs.readonly) return;
            const name = e.target.value;
            if (name === title) return;
            title = name;
            vnode.attrs.cb && vnode.attrs.cb(name);
            this.resize(vnode);
          },
        })
      )
    }
  };
}

export function FlowEditor(): m.Component {
  return {
    oninit(vnode) {
      dispatch(_events.action.requestFlow, { flowId: vnode.attrs.id });     
      vnode.state.flow = globalThis.flowService.flow;
      vnode.state.matches = globalThis.flowService.matches;
    },
    onbeforeupdate(vnode) {
      if(skipRederaw){
        skipRederaw = false;
        return false;
      }

      vnode.state.flow = globalThis.flowService.flow;
      vnode.state.matches = globalThis.flowService.matches;
    },
    onremove() {
      globalThis.flowService.clear();
    },
    view(vnode) {
      const canEdit = globalThis.flowService?.canEdit();
      return m(".flow", [
        // title & toolbar
        m(".flex justify-between gap-4", [
          m(
            "h1.text-2xl font-bold text-base-content min-w-0 flex-grow break-words overflow-wrap",
            m(TitleInput, {
              title: vnode.state.flow.name,
              readonly: !canEdit,
              cb: (newTitle) => {
                if (!canEdit) return;
                globalThis.flowService.updateFlow({
                  ...globalThis.flowService.flow,
                  name: newTitle,
                });
              },
            })
          ),
          m(".toolbar-wrapper flex-shrink-0", {
            class: '!z-[101]'
          }, m(FlowToolbar)),
        ]),
        m(FlowDescriptionEditor, { description: globalThis.flowService.flow.description }),
        m(FlowMatchList, {
          matches: vnode.state.matches,
        }),
        m(InsertBetweenDialog)
      ]);
    },
  };
}
