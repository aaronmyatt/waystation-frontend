import m from "mithril";
import { MarkdownRenderer } from "./ws-marked";
import { SyntaxHighlighter } from "./ws-hljs";
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
  _flow = {
    flow: {},
    matches: [],
  };

  get flow() {
    return this._flow?.flow || {};
  }

  get matches() {
    return this._flow?.matches || [];
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
    return m("ul.flow-toolbar.flex flex-wrap gap-2 mb-6", [
      m(
        "button.btn btn-sm btn-outline",
        {
          onclick: () => {
            dispatch(_events.action.editFlow, globalThis.flowService);
          },
        },
        "Edit"
      ),
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
          "ul.menu dropdown-content bg-base-200 rounded-box z-1 w-52 p-2 shadow-sm",
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
      return m(
        ".code.card bg-base-200 mt-4",
        m(
          ".card-body p-4",
          m(
            "pre.overflow-x-auto",
            m("code", { classes: `language-${language}` }, m.trust(code))
          )
        )
      );
    },
  };
}

function FlowDescriptionMd() {
  let description = "";
  return {
    oninit(vnode) {
      if (vnode.attrs.description)
        description = globalThis.marked.parse(vnode.attrs.description);
    },
    view() {
      return m(".text-base text-base-content/70 mt-2", m.trust(description));
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
  _title(match) {
    const maybeNote = match.note?.name;
    const maybeContent = match.step_content?.title;
    return maybeNote || maybeContent || "";
  },
  _description(match) {
    const maybeNote = match.note?.description;
    const maybeContent = match.step_content?.body;
    return maybeNote || maybeContent || "";
  },
  view(vnode) {
    const match = vnode.attrs.match;
    const description = this._description(match);
    return m(
      ".match.card bg-base-100 shadow-md border border-base-300 mb-6",
      {
        class:
          "hover:shadow-lg hover:border-primary transition-shadow duration-300 cursor-pointer",
        onclick: () => {
          dispatch(_events.action.clickFlowMatch, { match });
        },
      },
      m(".card-body", [
        // title & toolbar
        m(".flex justify-between items-center mb-2", [
          m("h2.text-lg font-semibold text-primary", this._title(match)),
          m(".toolbar-wrapper", m(FlowMatchToolbar)),
        ]),
        description && m(FlowMatchDescriptionMd, { description }),
        match.content_kind === "match" && m(FlowMatchCodeBlock, { match }),
      ])
    );
  },
};

const FlowMatchDescriptionMd = FlowDescriptionMd;
const FlowMatchInsertBetween = {
  view(vnode) {
    const match = vnode.attrs.match;
    const index = vnode.attrs.index;
    return m(".my-4 flex justify-center",
      m("button.btn btn-sm btn-outline",
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

export function Flow() {
  let title = "";
  let description = "";
  return {
    oninit() {
      title = globalThis.flowService.flow.name;
      description = globalThis.flowService.flow.description;
    },
    view() {
      return m(".flow.container mx-auto p-4 max-w-5xl", [
        // title & toolbar
        m(".flex justify-between items-center mb-4", [
          m("h1.text-2xl font-bold text-base-content", title),
          m(".toolbar-wrapper", m(FlowToolbar)),
        ]),
        description && m(FlowDescriptionMd, { description }),
        m(
          ".mt-8",
          m("h2.text-xl font-semibold mb-4", "Matches"),
          m(FlowMatchList)
        ),
      ]);
    },
  };
}
