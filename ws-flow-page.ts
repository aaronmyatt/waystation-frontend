import m from "mithril";
import { MarkdownRenderer } from "./ws-marked";
import { SyntaxHighlighter } from "./ws-hljs";
import OverType from "overtype";
import { upSvg, downSvg, verticalDotsSvg, plusSvg } from "./ws-svg";

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
      flow_match_id: string;
      content_kind: string;
      note?: { name: string; description: string };
      step_content?: { title: string; body: string };
      match: {
        file_name: string;
        grep_meta: string;
      };
      order_index?: number;
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

  updateFlow(flow) {
    this._flow.flow = flow;
    dispatch("ws::flow:updated", this._flow.flow);
    console.debug("Flow updated:", this._flow.flow);
  }

  updateFlowMatch(match) {
    const index = this.matches.findIndex((m) => m.id === match.id);
    if (index !== -1) {
      this._flow.matches[index] = match;
      dispatch("ws::flowMatch:updated", match);
      console.debug("Flow match updated:", match);
    }
  }

  addNoteStep(match, index) {
    const insertIndex = index + 1;
    this._flow.matches.splice(insertIndex, 0, match);
    
    // Update order indexes for all matches after the insertion point
    for (let i = insertIndex + 1; i < this._flow.matches.length; i++) {
      const currentMatch = this._flow.matches[i];
      if (currentMatch.order_index !== undefined) {
        currentMatch.order_index = i;
      }
    }
    
    dispatch("ws::flowMatch:added", match);
    console.debug("Flow match added at index:", insertIndex, match);
  }

  load(flow) {
    if (flow.hasOwnProperty("flow") && flow.hasOwnProperty("matches")) {
      this._flow = flow;
    } else {
      throw `Incorrect object properties: ${Object.keys(flow)}`;
    }
  }

  reset() {
    this._flow = {
      flow: {
        name: "New Flow",
        description: "Describe your flow here.",
      },
      matches: [
        {
          flow_match_id: crypto.randomUUID(),
          content_kind: "note",
          note: {
            name: "New Step",
            description: "Click edit to describe this step",
          },
          match: {
            file_name: "",
            grep_meta: JSON.stringify({ context_lines: [] }),
          },
        },
      ],
    };
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
  view(vnode) {
    return m(
      "ul.match-toolbar.flex flex-wrap gap-2",
      {
        onclick: (e) => {
          e.stopPropagation();
        },
      },
      [
        m(
          "button.btn btn-xs btn-ghost",
          {
            onclick: (e) => {
              dispatch(_events.action.moveFlowMatchUp, {
                match: vnode.attrs.match,
              });
            },
          },
          m("span.text-primary block size-4", m.trust(upSvg))
        ),
        m(
          "button.btn btn-xs btn-ghost",
          {
            onclick: (e) => {
              dispatch(_events.action.moveFlowMatchDown, {
                match: vnode.attrs.match,
              });
            },
          },
          m("span.text-primary block size-4", m.trust(downSvg))
        ),

        m(
          "button.btn btn-xs btn-outline",
          {
            onclick: (e) => {
              dispatch(_events.action.editFlowMatch, {
                match: vnode.attrs.match,
              });
              vnode.attrs.editCb && vnode.attrs.editCb(e);
            },
          },
          "Edit"
        ),
        m(
          ".dropdown dropdown-end",
          m(
            ".btn btn-xs btn-ghost text-primary",
            { tabIndex: 0 },
            m("span.block size-4 text-primary", m.trust(verticalDotsSvg))
          ),
          m(
            "ul.menu dropdown-content bg-base-200 rounded-box z-10 w-52 p-2 shadow-sm",
            { tabIndex: -1 },
            m(
              "li",
              m(
                "a",
                {
                  onclick: (e) => {
                    dispatch(_events.action.createChildFlow, {
                      match: vnode.attrs.match,
                    });
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
                    dispatch(_events.action.generateFlowMatchContent, {
                      match: vnode.attrs.match,
                    });
                  },
                },
                "Generate Description"
              )
            ),
            m(
              "li",
              m(
                "a.text-error",
                {
                  onclick: (e) => {
                    dispatch(_events.action.deleteFlowMatch, {
                      match: vnode.attrs.match,
                    });
                  },
                },
                "Delete Match"
              )
            )
          )
        ),
      ]
    );
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
      return m(
        ".code.card bg-base-200 p-1",
        m(
          "pre.overflow-x-auto",
          m("code", { class: `language-${language}` }, m.trust(code))
        )
      );
    },
  };
}

function FlowMatchList() {
  return {
    view(vnode) {
      return m(
        "div.match-list",
        vnode.attrs.matches.toSorted((a, b) => a.order_index - b.order_index).map(function (match, index) {
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
  return {
    oninit(vnode) {
      vnode.state.title =
        vnode.attrs.match.note?.name ||
        vnode.attrs.match.step_content?.title ||
        "";
    },
    view(vnode) {
      return m.fragment([
        m(
          // peer: allows the next sibling to style itself based on this element's hover state
          ".match.card bg-base-100 shadow-md border border-base-300 peer",
          {
            class:
              "hover:shadow-lg hover:border-primary transition-shadow duration-300 cursor-pointer",
            style: `--card-p: 1rem;`,
            onclick: () => {
              dispatch(_events.action.clickFlowMatch, { ...vnode.attrs.match });
            },
          },
          m(".card-body", [
            // title & toolbar
            m(".flex justify-between", [
              editing
                ? m(
                    "h2.text-lg flex-1 font-semibold text-accent-content",
                    {
                      onclick: (e) => {
                        e.stopPropagation();
                      },
                    },
                    m("input.input input-bordered", {
                      value: vnode.state.title,
                      placeholder: "##Title",
                      oninput: (e) => {
                        vnode.state.title = e.target.value;
                        const updatedMatch = { ...vnode.attrs.match };
                        if (updatedMatch.note) {
                          updatedMatch.note.name = vnode.state.title;
                        }
                        if (updatedMatch.step_content) {
                          updatedMatch.step_content.title = vnode.state.title;
                        }

                        globalThis.flowService.updateFlowMatch({
                          ...updatedMatch,
                        });
                      },
                    })
                  )
                : m(
                    "h2.text-lg flex-1 font-semibold text-accent-content",
                    { class: vnode.state.title === "" ? "h-1" : "" },
                    vnode.state.title
                  ),
              m(
                ".toolbar-wrapper",
                m(FlowMatchToolbar, {
                  match: vnode.attrs.match,
                  editCb: (e) => {
                    editing = !editing;
                  },
                })
              ),
            ]),
            m(FlowMatchDescriptionEditor, {
              match: vnode.attrs.match,
              togglePreview: !editing,
            }),
            vnode.attrs.match.content_kind === "match" &&
              m(FlowMatchCodeBlock, { match: vnode.attrs.match }),
          ])
        ),
        m(FlowMatchInsertBetween, { match: vnode.attrs.match, index: vnode.attrs.index }),
      ]);
    },
  };
}

const FlowMatchInsertBetween = {
  oninit(vnode){
    vnode.state.showDialog = false;
  },
  view(vnode) {
    const match = vnode.attrs.match;
    const index = vnode.attrs.index;
    return m(
      ".flex justify-center",
      {
        // group: allows children to respond to this wrapper's hover state
        // peer-hover:[&>button]:opacity-100: shows button when preceding peer (FlowMatch) is hovered
        class: `group peer-hover:[&>button]:opacity-100 peer-hover:[&>button]:my-4`,
      },
      m(
        // opacity-0: hidden by default
        // group-hover:opacity-100: shows when hovering over the wrapper itself
        // transition-opacity: smooth fade in/out
        "button.btn btn-sm btn-outline w-full opacity-0 group-hover:opacity-100 group-hover:my-4 transition-opacity",
        {
          onclick: () => {
            vnode.state.showDialog = true;
          },
        },
        m("span.text-primary block size-4", m.trust(plusSvg))
      ),
      m('dialog.modal',
        {
          class: vnode.state.showDialog ? 'modal-open' : '',
        },
        m(".modal-box",
          [
            m('h4', 'Add a Step'),
            m('p.mb-4', 'Would you like to insert a text only note or a match from your editor cursor position/selection?'),
            m('.modal-action',
              [
                m('button.btn btn-primary', {
                  onclick: () => {
                    dispatch(_events.action.insertFlowMatchAfter, { match, index, kind: 'note' });
                    vnode.state.showDialog = false;
                  }
                }, 'Match from cursor'),
                m('button.btn btn-secondary', {
                  onclick: () => {
                    console.log('Adding note step at index', index);
                    globalThis.flowService.addNoteStep({
                      flow_match_id: crypto.randomUUID(),
                      content_kind: 'note',
                      step_content: { title: 'New Note', body: '' },
                      match_id: undefined,
                      order_index: index + 1,
                    }, index);
                    vnode.state.showDialog = false;
                  }
                }, 'Add Note')
              ]
            )
          ]
        )
      )
    );
  },
};

function overtypeOptions(vnode) {
  const previewTheme = {
    name: "ws-flow-preview-theme",
    colors: {
      bgPrimary: "oklch(98% 0 0)", // Lemon Chiffon - main background
      bgSecondary: "oklch(98% 0 0)", // White - editor background
      text: "#0d3b66", // Yale Blue - main text
      textPrimary: "#0d3b66", // Yale Blue - primary text (same as text)
      textSecondary: "#5a7a9b", // Muted blue - secondary text
      h1: "#f95738", // Tomato - h1 headers
      h2: "#ee964b", // Sandy Brown - h2 headers
      h3: "#3d8a51", // Forest green - h3 headers
      strong: "#ee964b", // Sandy Brown - bold text
      em: "#f95738", // Tomato - italic text
      del: "#ee964b", // Sandy Brown - deleted text (same as strong)
      link: "#0d3b66", // Yale Blue - links
      code: "#0d3b66", // Yale Blue - inline code
      codeBg: "rgba(244, 211, 94, 0.4)", // Naples Yellow with transparency
      blockquote: "#5a7a9b", // Muted blue - blockquotes
      hr: "#5a7a9b", // Muted blue - horizontal rules
      syntaxMarker: "rgba(13, 59, 102, 0.52)", // Yale Blue with transparency
      syntax: "#999999", // Gray - syntax highlighting fallback
      cursor: "#f95738", // Tomato - cursor
      selection: "rgba(244, 211, 94, 0.4)", // Naples Yellow with transparency
      listMarker: "#ee964b", // Sandy Brown - list markers
      rawLine: "#5a7a9b", // Muted blue - raw line indicators
      border: "#e0e0e0", // Light gray - borders
      hoverBg: "#f0f0f0", // Very light gray - hover backgrounds
      primary: "#0d3b66", // Yale Blue - primary accent
      // Toolbar colors
      toolbarBg: "#ffffff", // White - toolbar background
      toolbarIcon: "#0d3b66", // Yale Blue - icon color
      toolbarHover: "#f5f5f5", // Light gray - hover background
      toolbarActive: "#faf0ca", // Lemon Chiffon - active button background
    },
  };

  const editTheme = {
    name: "ws-flow-edit-theme",
    colors: {
      bgPrimary: "#fff8e7", // Warm cream - edit mode background
      bgSecondary: "#fffcf5", // Lighter cream - editor background
      text: "#1a4d2e", // Dark forest green - main text
      textPrimary: "#1a4d2e", // Dark forest green - primary text
      textSecondary: "#4a7c59", // Medium green - secondary text
      h1: "#d84315", // Deep orange - h1 headers
      h2: "#f57c00", // Orange - h2 headers
      h3: "#2e7d32", // Green - h3 headers
      strong: "#f57c00", // Orange - bold text
      em: "#d84315", // Deep orange - italic text
      del: "#f57c00", // Orange - deleted text
      link: "#1a4d2e", // Dark forest green - links
      code: "#1a4d2e", // Dark forest green - inline code
      codeBg: "rgba(255, 224, 130, 0.3)", // Light amber with transparency
      blockquote: "#4a7c59", // Medium green - blockquotes
      hr: "#4a7c59", // Medium green - horizontal rules
      syntaxMarker: "rgba(26, 77, 46, 0.52)", // Dark green with transparency
      syntax: "#888888", // Gray - syntax highlighting fallback
      cursor: "#d84315", // Deep orange - cursor
      selection: "rgba(255, 224, 130, 0.5)", // Amber with transparency
      listMarker: "#f57c00", // Orange - list markers
      rawLine: "#4a7c59", // Medium green - raw line indicators
      border: "#e0c896", // Tan - borders
      hoverBg: "#fff4d6", // Light cream - hover backgrounds
      primary: "#1a4d2e", // Dark forest green - primary accent
      // Toolbar colors
      toolbarBg: "#fffcf5", // Light cream - toolbar background
      toolbarIcon: "#1a4d2e", // Dark forest green - icon color
      toolbarHover: "#fff8e7", // Warm cream - hover background
      toolbarActive: "#ffe082", // Amber - active button background
    },
  };

  return {
    value: vnode.attrs.value || "",
    placeholder: vnode.attrs.placeholder || "",
    toolbar: vnode.attrs.toolbar || false,
    onChange: vnode.attrs.onChange || (() => {}),
    onKeydown: vnode.attrs.onKeydown || (() => {}),
    autoResize: true,
    padding: vnode.attrs.padding || "4px",
    minHeight: vnode.attrs.minHeight || "40px",
    fontFamily:
      vnode.attrs.fontFamily ||
      '"SF Mono", SFMono-Regular, Menlo, Monaco, "Cascadia Code", Consolas, "Roboto Mono", "Noto Sans Mono", "Droid Sans Mono", "Ubuntu Mono", "DejaVu Sans Mono", "Liberation Mono", "Courier New", Courier, monospace',
    fontSize: vnode.attrs.fontSize || "16px",
    lineHeight: vnode.attrs.lineHeight || "1.5",
    theme: vnode.attrs.preview ? previewTheme : editTheme,
  };
}

const OvertypeBase = {
  editors: [],
  oncreate(vnode) {
    const options = overtypeOptions(vnode);
    vnode.state.editors = OverType.init(vnode.dom, options);
    for (const editor of vnode.state.editors) {
      vnode.dom._overtype = editor;
      vnode.attrs.preview && editor.showPreviewMode();
      break;
    }

    const overTypePreview = vnode.dom.querySelector(".overtype-preview");
    // match the preview styles to the editor options
    overTypePreview.style.setProperty(
      "font-size",
      options.fontSize,
      "important"
    );
    overTypePreview.style.setProperty(
      "line-height",
      options.lineHeight,
      "important"
    );
    overTypePreview.style.setProperty(
      "font-family",
      options.fontFamily,
      "important"
    );
  },
  onremove(vnode) {
    for (const editor of vnode.state.editors) {
      editor.destroy();
    }
    vnode.state.editors = [];
  },
  onbeforeupdate(vnode) {
    const { theme } = overtypeOptions(vnode);
    for (const editor of vnode.state.editors) {
      if (vnode.attrs.preview) {
        editor.showPreviewMode();
        editor.setTheme(theme);
      } else {
        editor.showNormalEditMode();
        editor.setTheme(theme);
      }
    }
  },
  onupdate(vnode){
    for (const editor of vnode.state.editors) {
      editor.setValue(vnode.attrs.value || "");
    }
  },
  view(vnode) {
    return m(".inner-editor", {
      onclick: (e) => {
        !vnode.attrs.preview && e.stopPropagation();
      },
    });
  },
};

function FlowDescriptionEditor() {
  return {
    oninit(vnode){
      vnode.state.description = globalThis.flowService.flow.description
      console.log(vnode.state.description, vnode.attrs.description)
    },
    onbeforeupdate(vnode){
      vnode.state.description = globalThis.flowService.flow.description
      console.log(vnode.state.description, vnode.attrs.description)
    },
    view(vnode) {
      return m(
        ".editor",
        m(OvertypeBase, {
          value: vnode.state.description || "",
          placeholder: "Enter description...",
          onChange: (description) => {
            if (description === vnode.state.description) return;
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
    oninit(vnode) {
      vnode.state.description =
        vnode.attrs.match.note?.description ||
        vnode.attrs.match.step_content?.body;
    },
    view(vnode) {
      return m(
        ".editor",
        {
          class: (vnode.attrs.togglePreview && !vnode.state.description) ? "hidden" : ""
        },
        [
          !vnode.attrs.togglePreview &&
            m("h3.text-md font-semibold mb-2", "Description"),
          m(OvertypeBase, {
            value: vnode.state.description,
            preview: vnode.attrs.togglePreview,
            onKeydown: (e) => {
              const newValue = e.target.value;
              const updatedMatch = { ...vnode.attrs.match };

              if (updatedMatch.content_kind === "note") {
                updatedMatch.step_content = {
                  ...updatedMatch.step_content,
                  body: newValue,
                };
              } else if (updatedMatch.content_kind === "match") {
                updatedMatch.note = {
                  ...updatedMatch.note,
                  description: newValue,
                };
              }
              vnode.state.description = newValue;
              globalThis.flowService.updateFlowMatch({ ...updatedMatch });
            },
          }),
        ]
      );
    },
  };
}

export function Flow() {
  return {
    oninit(vnode) {
      vnode.state.flow = globalThis.flowService.flow;
      vnode.state.matches = globalThis.flowService.matches;
    },
    onbeforeupdate(vnode) {
      vnode.state.flow = globalThis.flowService.flow;
      vnode.state.matches = globalThis.flowService.matches;
    },
    view(vnode) {
      return m(".flow.container mx-auto p-4 max-w-5xl", [
        // title & toolbar
        m(".flex justify-between items-baseline", [
          m(
            "h1.text-2xl flex-1 font-bold text-base-content",
            m("input.title w-full", {
              value: this.flow.name,
              name: "flow title",
              oninput: (e) => {
                const name = e.target.value;
                globalThis.flowService.updateFlow({
                  ...vnode.state.flow,
                  name,
                });
              },
            })
          ),
          m(".toolbar-wrapper", m(FlowToolbar)),
        ]),
        m(FlowDescriptionEditor, { description: globalThis.flowService.flow.description }),
        m(FlowMatchList, {
          matches: vnode.state.matches,
        }),
      ]);
    },
  };
}
