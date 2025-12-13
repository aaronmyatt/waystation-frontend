import m from "mithril";
import { MarkdownRenderer } from "./ws-marked";
import { SyntaxHighlighter } from "./ws-hljs";
import OverType from 'overtype';
import { upSvg, downSvg, verticalDotsSvg, plusSvg, editSvg } from "./ws-svg";

function dispatch(eventName, data) {
  return globalThis.dispatchEvent(
    new CustomEvent(eventName, { detail: data || {} })
  );
}

const _events = {
  action: {
    // flow actions
    editFlow: "ws::action:editFlow",
    export: "ws::action::export",
    generateFlowContent: "ws::action::generateFlowContent",

    // flow match actions
    editFlowMatch: "ws::action::editFlowMatch",
    deleteFlowMatch: "ws::action::deleteFlowMatch",
    moveFlowMatchUp: "ws::action::moveFlowMatchUp",
    moveFlowMatchDown: "ws::action::moveFlowMatchDown",
    generateFlowMatchContent: "ws::action::generateFlowMatchContent",
    insertFlowMatchAfter: "ws::action::insertFlowMatchAfter",

    // create a new flow with the current match as parent and first step
    createChildFlow: "ws::action::createChildFlow",

    // dispatch match click events for the extension to handle
    clickFlowMatch: "ws::click::flowMatch",
  },
};

class FlowService {
  _flow: {
    flow: { name: string; description: string };
    matches: {
      id: string;
      content_kind: string;
      note?: { name: string; description: string };
      step_content?: { title: string; body: string };
      match: {
        file_name: string;
        grep_meta: string;
      };
    }[];
  } = {
    flow: {
      name: "",
      description: "",
    },
    matches: [],
  };

  get flow() {
    return this._flow?.flow || {};
  }

  get matches() {
    return this._flow?.matches || [];
  }

  updateFlow(flow){
    this._flow.flow = flow;
    dispatch("ws::flow:updated", this._flow.flow);
    console.debug("Flow updated:", this._flow.flow);
    m.redraw();
  }

  updateFlowMatch(match){
    const index = this.matches.findIndex((m) => m.id === match.id);
    if (index !== -1) {
      this._flow.matches[index] = match;
      dispatch("ws::flowMatch:updated", match);
      console.debug("Flow match updated:", match);
      m.redraw();
    }
  }


  load(flow) {
    if (flow.hasOwnProperty("flow") && flow.hasOwnProperty("matches")) {
      this._flow = flow;
      m.redraw();
    } else {
      throw `Incorrect object properties: ${Object.keys(flow)}`;
    }
  }
}

globalThis.flowService = new FlowService();
globalThis.marked = new MarkdownRenderer();
globalThis.syntaxHighlighter = new SyntaxHighlighter();
const FlowToolbar = {
  view() {
    return m("ul.flow-toolbar.flex flex-wrap gap-2", [
      m(
        "button.btn btn-sm btn-outline",
        {
          onclick: () => {
            dispatch(_events.action.export, globalThis.flowService);
          },
        },
        "Export"
      ),
      m(
        ".dropdown dropdown-end",
        m(
          ".btn btn-xs btn-ghost text-primary",
          { tabIndex: 0 },
          m("span.block size-4 text-primary", m.trust(verticalDotsSvg))
        ),
        m(
          "ul.menu dropdown-content bg-base-200 rounded-box z-10 w-52 shadow-sm",
          { tabIndex: -1 },
          m(
            "li",
            m(
              "a",
              {
                onclick: () => {
                  dispatch(
                    _events.action.generateFlowContent,
                    globalThis.flowService
                  );
                },
              },
              "Generate Description"
            )
          )
        )
      ),
    ]);
  },
};

const FlowMatchToolbar = {
  view() {
    return m("ul.match-toolbar.flex flex-wrap gap-2 mb-4", [
      m(
        "button.btn btn-xs btn-ghost",
        {
          onclick: (e) => {
            e.stopPropagation();
            dispatch(_events.action.moveFlowMatchUp, globalThis.flowService);
          },
        },
        m("span.text-primary block size-4", m.trust(upSvg))
      ),
      m(
        "button.btn btn-xs btn-ghost",
        {
          onclick: (e) => {
            e.stopPropagation();
            dispatch(_events.action.moveFlowMatchDown, globalThis.flowService);
          },
        },
        m("span.text-primary block size-4", m.trust(downSvg))
      ),

      m(
        "button.btn btn-xs btn-outline",
        {
          onclick: (e) => {
            e.stopPropagation();
            dispatch(_events.action.editFlowMatch, globalThis.flowService);
          },
        },
        "Edit"
      ),
      m(
        "button.btn btn-xs btn-outline btn-error",
        {
          onclick: (e) => {
            e.stopPropagation();
            dispatch(_events.action.deleteFlowMatch, globalThis.flowService);
          },
        },
        "Delete"
      ),
      m(
        ".dropdown dropdown-end",
        {
          onclick: (e) => {
            e.stopPropagation();
          },
        },
        m(
          ".btn btn-xs btn-ghost text-primary",
          { tabIndex: 0 },
          m("span.block size-4 text-primary", m.trust(verticalDotsSvg))
        ),
        m(
          "ul.menu dropdown-content bg-base-200 rounded-box z-1 w-52 p-2 shadow-sm",
          { tabIndex: -1 },
          m(
            "li",
            m(
              "a",
              {
                onclick: (e) => {
                  e.stopPropagation();
                  dispatch(
                    _events.action.createChildFlow,
                    globalThis.flowService
                  );
                },
              },
              "Create Child Flow"
            )
          ),
          m(
            "li",
            m(
              "a",
              {
                onclick: (e) => {
                  e.stopPropagation();
                  dispatch(
                    _events.action.generateFlowMatchContent,
                    globalThis.flowService
                  );
                },
              },
              "Generate Description"
            )
          )
        )
      ),
    ]);
  },
};

function FlowMatchCodeBlock() {
  let code = "";
  let language = "";
  return {
    oninit(vnode) {
      const match = vnode.attrs.match.match;
      const meta = JSON.parse(match.grep_meta);
      const lines = meta.context_lines.join("\n");
      language = globalThis.syntaxHighlighter.pathExtension(match.file_name);
      code = globalThis.syntaxHighlighter.highlightCode(lines, language);
    },
    view() {
      return m(".code.card bg-base-200 p-1",
        m("pre.overflow-x-auto",
          m("code", { classes: `language-${language}` }, m.trust(code))
        )
      );
    },
  };
}

const FlowMatchList = {
  view() {
    return globalThis.flowService.matches.map((match, index) => {
      return m('div', 
        [
          m(FlowMatch, { match, index }), 
          m(FlowMatchInsertBetween, { match, index })
        ]);
    });
  },
};

const FlowMatch = {
  editing: false,
  _title(match) {
    const maybeNote = match.note?.name;
    const maybeContent = match.step_content?.title;
    // console.log("Determining title for match:", match, "->", maybeNote || maybeContent || "");
    return maybeNote || maybeContent || "";
  },
  view(vnode) {
    const match = vnode.attrs.match;
    const title = this._title(match);
    return m(
      // peer: allows the next sibling to style itself based on this element's hover state
      ".match.card bg-base-100 shadow-md border border-base-300 peer",
      {
        class:
          "hover:shadow-lg hover:border-primary transition-shadow duration-300 cursor-pointer",
        onclick: () => {
          dispatch(_events.action.clickFlowMatch, { match });
        },
      },
      m(".card-body", [
        // title & toolbar
        m(".flex justify-between items-center", [
          m('.flex', 
            [
              this.editing ? 
                m("h2.text-lg font-semibold text-accent-content",
                  m('input.title w-full border border-primary rounded p-1', { 
                    value: title,
                    onblur: () => {
                      this.editing = false;
                    },
                    oninput: (e) => {
                      const updatedMatch = { ...match }; 
                      const newValue = e.target.value;
                      if (vnode.attrs.match.content_kind === "match") {
                        updatedMatch.note = {
                          ...updatedMatch.note,
                          name: newValue,
                        };
                      } else if (vnode.attrs.match.content_kind === "note") {
                        updatedMatch.step_content = {
                          ...updatedMatch.step_content,
                          title: newValue,
                        };
                      } 
                      globalThis.flowService.updateFlowMatch({ ...updatedMatch } );
                    } 
                  })) 
              : m("h2.text-lg font-semibold text-primary", title),
              m('.btn btn-xs btn-ghost text-primary',
                {
                  onclick: (e) => {
                    e.stopPropagation();
                    this.editing = !this.editing;
                  }
                },
                m("span.block size-4 text-primary", m.trust(editSvg)))
            ]),
          m(".toolbar-wrapper", m(FlowMatchToolbar)),
        ]),
        m(FlowMatchDescriptionEditor, { match, onclick: (e) => e.stopPropagation() }),
        match.content_kind === "match" && m(FlowMatchCodeBlock, { match }),
      ])
    );
  },
};

const FlowMatchInsertBetween = {
  view(vnode) {
    const match = vnode.attrs.match;
    const index = vnode.attrs.index;
    return m(
      ".flex justify-center",
      {
        // group: allows children to respond to this wrapper's hover state
        // peer-hover:[&>button]:opacity-100: shows button when preceding peer (FlowMatch) is hovered
        class: `group peer-hover:[&>button]:opacity-100 peer-hover:[&>button]:my-4`
      },
      m(
        // opacity-0: hidden by default
        // group-hover:opacity-100: shows when hovering over the wrapper itself
        // transition-opacity: smooth fade in/out
        "button.btn btn-sm btn-outline w-full opacity-0 group-hover:opacity-100 group-hover:my-4 transition-opacity",
        {
          onclick: () => {
            dispatch(_events.action.insertFlowMatchAfter, { match, index });
          },
        },
        m("span.text-primary block size-4", m.trust(plusSvg))
      )
    );
  },
};

const OvertypeBase = {
  oncreate(vnode) {
    OverType.init(vnode.dom, {
        value: vnode.attrs.value || "",
        placeholder: vnode.attrs.placeholder || "",
        toolbar: vnode.attrs.toolbar || false,
        onChange: vnode.attrs.onChange || (() => {}),
        autoResize: vnode.attrs.autoResize || true,
        padding: vnode.attrs.padding || "4px",
        minHeight: vnode.attrs.minHeight || "10px",
        theme: {
          name: 'ws-flow-theme',
          colors: {
            bgPrimary: 'oklch(98% 0 0)',        // Lemon Chiffon - main background
            bgSecondary: 'oklch(98% 0 0)',      // White - editor background
            text: '#0d3b66',             // Yale Blue - main text
            textPrimary: '#0d3b66',      // Yale Blue - primary text (same as text)
            textSecondary: '#5a7a9b',    // Muted blue - secondary text
            h1: '#f95738',               // Tomato - h1 headers
            h2: '#ee964b',               // Sandy Brown - h2 headers
            h3: '#3d8a51',               // Forest green - h3 headers
            strong: '#ee964b',           // Sandy Brown - bold text
            em: '#f95738',               // Tomato - italic text
            del: '#ee964b',              // Sandy Brown - deleted text (same as strong)
            link: '#0d3b66',             // Yale Blue - links
            code: '#0d3b66',             // Yale Blue - inline code
            codeBg: 'rgba(244, 211, 94, 0.4)', // Naples Yellow with transparency
            blockquote: '#5a7a9b',       // Muted blue - blockquotes
            hr: '#5a7a9b',               // Muted blue - horizontal rules
            syntaxMarker: 'rgba(13, 59, 102, 0.52)', // Yale Blue with transparency
            syntax: '#999999',           // Gray - syntax highlighting fallback
            cursor: '#f95738',           // Tomato - cursor
            selection: 'rgba(244, 211, 94, 0.4)', // Naples Yellow with transparency
            listMarker: '#ee964b',       // Sandy Brown - list markers
            rawLine: '#5a7a9b',          // Muted blue - raw line indicators
            border: '#e0e0e0',           // Light gray - borders
            hoverBg: '#f0f0f0',          // Very light gray - hover backgrounds
            primary: '#0d3b66',          // Yale Blue - primary accent
            // Toolbar colors
            toolbarBg: '#ffffff',        // White - toolbar background
            toolbarIcon: '#0d3b66',      // Yale Blue - icon color
            toolbarHover: '#f5f5f5',     // Light gray - hover background
            toolbarActive: '#faf0ca',    // Lemon Chiffon - active button background
          }
        }
      });
  },
  view() {
    return m(".inner-editor");
  },
};

const FlowDescriptionEditor = {
  view(vnode) {
    return m(".editor", m(OvertypeBase, {
      value: vnode.attrs.flow.description || "",
      placeholder: "Enter description...",
      onChange: (newValue) => {
        globalThis.flowService.updateFlow({ ...vnode.attrs.flow, description: newValue } );
      }
    }))
  },
};

const FlowMatchDescriptionEditor = {
  view(vnode) {
    return m(".editor", m(OvertypeBase, {
      value: vnode.attrs.match.note?.description || vnode.attrs.match.step_content?.body || "",
      placeholder: "Enter description...",
      onChange: (newValue) => {
        const updatedMatch = { ...vnode.attrs.match };
        if (vnode.attrs.match.content_kind === "note") {
          updatedMatch.step_content = {
            ...updatedMatch.step_content,
            body: newValue,
          };
        } else if (vnode.attrs.match.content_kind === "match") {
          updatedMatch.note = {
            ...updatedMatch.note,
            description: newValue,
          };
        }
        globalThis.flowService.updateFlowMatch({ ...updatedMatch });
      }
    }))
  },
};

export function Flow() {
  let title = "";
  return {
    oninit() {
      title = globalThis.flowService.flow.name;
    },
    view() {
      return m(".flow.container mx-auto p-4 max-w-5xl", [
        // title & toolbar
        m(".flex justify-between items-baseline", [
          m("h1.text-2xl flex-1 font-bold text-base-content", 
            m('input.title w-full', { 
              value: title,
              oninput: (e) => { 
                const title = e.target.value; 
                globalThis.flowService.updateFlow({ ...globalThis.flowService.flow, name: title } );
              } 
            })
          ),
          m(".toolbar-wrapper", m(FlowToolbar)),
        ]),
        m(FlowDescriptionEditor, { flow: globalThis.flowService.flow }),
        m(FlowMatchList),
      ]);
    },
  };
}
