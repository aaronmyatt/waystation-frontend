import m from "mithril";
import { MarkdownRenderer } from "./ws-marked";
import { SyntaxHighlighter } from "./ws-hljs";
import OverType from "overtype";
import { upSvg, downSvg, verticalDotsSvg, plusSvg } from "./ws-svg";
import { debounce } from "./utils";

let skipRederaw = false;

function dispatch(eventName, data) {
  return globalThis.dispatchEvent(
    new CustomEvent(eventName, { detail: data || {} })
  );
}

const _events = {
  action: {
    // flow actions
    export: "ws::action::export",
    generateFlowContent: "ws::action::generateFlowContent",
    deleteFlow: "ws::action::deleteFlow",

    // flow match actions
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

  dispatchUpdated(){
    dispatch("ws::flow:updated", this._flow);
  }

  updateFlow(flow) {
    this._flow.flow = flow;
    this.dispatchUpdated();
    console.debug("Flow updated:", this._flow);
  }

  updateFlowMatch(match) {
    const index = this.matches.findIndex((m) => m.flow_match_id === match.flow_match_id);
    if (index !== -1) {
      this._flow.matches[index] = match;
      this.dispatchUpdated();
      console.debug("Flow match updated:", match);
    }
  }

  deleteFlowMatch(match) {
    const index = this.matches.findIndex((m) => m.flow_match_id === match.flow_match_id);
    if (index !== -1) {
      this._flow.matches.splice(index, 1);
      // Update order indexes for remaining matches
      for (let i = index; i < this._flow.matches.length; i++) {
        const currentMatch = this._flow.matches[i];
        if (currentMatch.order_index !== undefined) {
          currentMatch.order_index = i;
        }
      }
      this.dispatchUpdated();
      console.debug("Flow match deleted:", match);
    }
  }

  moveFlowMatchUp(match) {
    const index = this.matches.findIndex((m) => m.flow_match_id === match.flow_match_id);
    if (index > 0) {
      [this._flow.matches[index - 1], this._flow.matches[index]] = [this._flow.matches[index], this._flow.matches[index - 1]];
      // Update order indexes
      this._flow.matches[index - 1].order_index = index - 1;
      this._flow.matches[index].order_index = index;
      this.dispatchUpdated();
      console.debug("Flow match moved up:", match);
    }
  }

  moveFlowMatchDown(match) {
    const index = this.matches.findIndex((m) => m.flow_match_id === match.flow_match_id);
    if (index !== -1 && index < this._flow.matches.length - 1) {
      [this._flow.matches[index + 1], this._flow.matches[index]] = [this._flow.matches[index], this._flow.matches[index + 1]];
      // Update order indexes
      this._flow.matches[index + 1].order_index = index + 1;
      this._flow.matches[index].order_index = index;
      this.dispatchUpdated();
      console.debug("Flow match moved down:", match);
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
    
    this.dispatchUpdated();
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

  clear() {
    this._flow = {
      flow: {
        name: "",
        description: "",
      },
      matches: [],
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
          ),
m(
            "li",
            m(
              "a.text-error",
              {
                onclick: () => {
                  dispatch(
                    _events.action.deleteFlow,
                    globalThis.flowService.flow
                  );
                },
              },
              "Delete Flow"
            )
          )
        ),
        
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
          "button.btn btn-xs btn-outline",
          {
            onclick: (e) => {
              vnode.attrs.editCb && vnode.attrs.editCb(e);
            },
          },
          vnode.attrs.editing ? "Save" : "Edit"
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
                    globalThis.flowService.deleteFlowMatch(vnode.attrs.match);
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
            onclick: (e) => {
              skipRederaw = true;
              debounce((match) => {
                dispatch(_events.action.clickFlowMatch, {  ...match  });
              }, 300)(vnode.attrs.match);
            },
          },
          m(".card-body", [
            // title & toolbar
            m(".flex justify-between", [
              editing
                ? m(
                    "h2.text-lg flex-1 font-semibold text-secondary",
                    {
                      onclick: (e) => {
                        e.stopPropagation();
                      },
                    },
                    m("input.input input-bordered", {
                      value: title,
                      placeholder: "##Title",
                      oninput: (e) => { title = e.target.value;},
                    })
                  )
                : m(
                    "h2.text-lg flex-1 font-semibold text-secondary",
                    { class: title === "" ? "h-1" : "" },
                    title
                  ),
              m(
                ".toolbar-wrapper",
                m(FlowMatchToolbar, {
                  editing,
                  match: vnode.attrs.match,
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
            m(FlowMatchDescriptionEditor, {
              description,
              togglePreview: !editing,
              onKeydown: (e) => { description = e.target.value; }
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
            m('form', { method: "dialog" },
              m('button.btn btn-sm btn-circle btn-ghost absolute right-2 top-2', {
                onclick: () => { vnode.state.showDialog = false; }
              }, '✕')
            ),
            m('h4.font-bold', 'Add a Step'),
            m('p.mb-4', 'Would you like to insert a text only note or a match from your editor cursor position/selection?'),
            m('.modal-action',
              [
                m('button.btn btn-primary', {
                  onclick: () => {
                    // NOTE: I'm accepting the awkwardness of using globalThis.flowService 
                    // here since this action is exclusively handled by the vscode extension
                    dispatch(_events.action.insertFlowMatchAfter, { flowId: globalThis.flowService.flow.id, match, index });
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
            ),
          ]
        ),
        m('form.modal-backdrop', { method: "dialog", onclick: () => { vnode.state.showDialog = false; } }, m('button', 'Close'))
      )
    );
  },
};

function overtypeOptions(vnode) {
  // Helper to get CSS variable value
  const getCSSVar = (varName) => {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  };

  // Helper to add transparency to a color (works with oklch, rgb, hex)
  const addAlpha = (color, alpha = 0.4) => {
    if (!color) return color;
    // If it's already an oklch color, add alpha
    if (color.startsWith('oklch(')) {
      return color.replace(')', ` / ${alpha})`);
    }
    // If it's a hex color, convert to rgba
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    // If it's already rgba or has transparency, return as is
    return color;
  };

  const previewTheme = {
    name: "ws-flow-preview-theme",
    colors: {
      bgPrimary: getCSSVar('--color-base-100') || "oklch(98% 0 0)",
      bgSecondary: getCSSVar('--color-base-100') || "oklch(98% 0 0)",
      text: getCSSVar('--color-base-content') || "#0d3b66",
      textPrimary: getCSSVar('--color-base-content') || "#0d3b66",
      textSecondary: getCSSVar('--color-neutral-content') || "#5a7a9b",
      h1: getCSSVar('--color-error') || "#f95738",
      h2: getCSSVar('--color-warning') || "#ee964b",
      h3: getCSSVar('--color-success') || "#3d8a51",
      strong: getCSSVar('--color-warning') || "#ee964b",
      em: getCSSVar('--color-error') || "#f95738",
      del: getCSSVar('--color-warning') || "#ee964b",
      link: getCSSVar('--color-info') || "#0d3b66",
      code: getCSSVar('--color-accent-content') || "#0d3b66",
      codeBg: getCSSVar('--color-base-200') || "rgba(244, 211, 94, 0.4)",
      blockquote: getCSSVar('--color-neutral-content') || "#5a7a9b",
      hr: getCSSVar('--color-neutral') || "#5a7a9b",
      syntaxMarker: getCSSVar('--color-base-content') || "rgba(13, 59, 102, 0.52)",
      syntax: getCSSVar('--color-neutral-content') || "#999999",
      cursor: getCSSVar('--color-primary') || "#f95738",
      selection: addAlpha(getCSSVar('--color-base-200'), 0.4) || "rgba(244, 211, 94, 0.4)",
      listMarker: getCSSVar('--color-warning') || "#ee964b",
      rawLine: getCSSVar('--color-neutral-content') || "#5a7a9b",
      border: getCSSVar('--color-base-300') || "#e0e0e0",
      hoverBg: getCSSVar('--color-base-200') || "#f0f0f0",
      primary: getCSSVar('--color-primary') || "#0d3b66",
      // Toolbar colors
      toolbarBg: getCSSVar('--color-base-100') || "#ffffff",
      toolbarIcon: getCSSVar('--color-base-content') || "#0d3b66",
      toolbarHover: getCSSVar('--color-base-200') || "#f5f5f5",
      toolbarActive: getCSSVar('--color-primary') || "#faf0ca",
    },
  };

  const editTheme = {
    name: "ws-flow-edit-theme",
    colors: {
      bgPrimary: getCSSVar('--color-base-200') || "#fff8e7",
      bgSecondary: getCSSVar('--color-base-100') || "#fffcf5",
      text: getCSSVar('--color-base-content') || "#1a4d2e",
      textPrimary: getCSSVar('--color-base-content') || "#1a4d2e",
      textSecondary: getCSSVar('--color-neutral-content') || "#4a7c59",
      h1: getCSSVar('--color-error') || "#d84315",
      h2: getCSSVar('--color-warning') || "#f57c00",
      h3: getCSSVar('--color-success') || "#2e7d32",
      strong: getCSSVar('--color-warning') || "#f57c00",
      em: getCSSVar('--color-error') || "#d84315",
      del: getCSSVar('--color-warning') || "#f57c00",
      link: getCSSVar('--color-info') || "#1a4d2e",
      code: getCSSVar('--color-accent-content') || "#1a4d2e",
      codeBg: getCSSVar('--color-base-300') || "rgba(255, 224, 130, 0.3)",
      blockquote: getCSSVar('--color-neutral-content') || "#4a7c59",
      hr: getCSSVar('--color-neutral') || "#4a7c59",
      syntaxMarker: getCSSVar('--color-base-content') || "rgba(26, 77, 46, 0.52)",
      syntax: getCSSVar('--color-neutral-content') || "#888888",
      cursor: getCSSVar('--color-primary') || "#d84315",
      selection: addAlpha(getCSSVar('--color-base-300'), 0.5) || "rgba(255, 224, 130, 0.5)",
      listMarker: getCSSVar('--color-warning') || "#f57c00",
      rawLine: getCSSVar('--color-neutral-content') || "#4a7c59",
      border: getCSSVar('--color-base-300') || "#e0c896",
      hoverBg: getCSSVar('--color-base-200') || "#fff4d6",
      primary: getCSSVar('--color-primary') || "#1a4d2e",
      // Toolbar colors
      toolbarBg: getCSSVar('--color-base-100') || "#fffcf5",
      toolbarIcon: getCSSVar('--color-base-content') || "#1a4d2e",
      toolbarHover: getCSSVar('--color-base-200') || "#fff8e7",
      toolbarActive: getCSSVar('--color-primary') || "#ffe082",
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
    },
    onbeforeupdate(vnode){
      vnode.state.description = globalThis.flowService.flow.description
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
    view(vnode) {
      return m(
        ".editor",
        {
          class: (vnode.attrs.togglePreview && !vnode.attrs.description) ? "hidden" : ""
        },
        [
          !vnode.attrs.togglePreview &&
            m("h3.text-md font-semibold mb-2", "Description"),
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

export function Flow() {
  return {
    oninit(vnode) {
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
