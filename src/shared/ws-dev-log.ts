import m from "mithril";

interface LogEntry {
  timestamp: string;
  eventName: string;
  eventType: string;
  detail: any;
}

interface DevLogState {
  eventCount: number;
  allLogs: LogEntry[];
  isCollapsed: boolean;
  autoScrollEnabled: boolean;
}

export const DevLog = () => {
  const state: DevLogState = {
    eventCount: 0,
    allLogs: [],
    isCollapsed: false,
    autoScrollEnabled: true,
  };

  let logContentEl: HTMLElement | null = null;

  const shouldAutoScroll = () => {
    if (!logContentEl) return true;
    const { scrollTop, scrollHeight, clientHeight } = logContentEl;
    return scrollHeight - scrollTop - clientHeight < 50;
  };

  const logEvent = (eventType: string, eventName: string, detail: any) => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      fractionalSecondDigits: 3,
    });

    state.eventCount++;

    state.allLogs.push({
      timestamp,
      eventName,
      eventType,
      detail,
    });

    m.redraw();

    // Auto-scroll after render
    if (state.autoScrollEnabled && logContentEl) {
      setTimeout(() => {
        if (logContentEl && shouldAutoScroll()) {
          logContentEl.scrollTop = logContentEl.scrollHeight;
        }
      }, 0);
    }
  };

  const setupEventListeners = () => {
    // Override dispatchEvent to catch CustomEvents
    const originalDispatch = EventTarget.prototype.dispatchEvent;
    EventTarget.prototype.dispatchEvent = function (event: Event) {
      if (event.type && event.type.startsWith("ws::")) {
        logEvent(
          "CustomEvent",
          event.type,
          event instanceof CustomEvent ? event.detail : null
        );
      }
      return originalDispatch.call(this, event);
    };

    // Listen for postMessage events
    window.addEventListener("message", (e: MessageEvent) => {
      if (typeof e.data === "string" && e.data.startsWith("ws::")) {
        logEvent("postMessage", e.data, null);
      } else if (
        e.data &&
        typeof e.data === "object" &&
        e.data.type &&
        e.data.type.startsWith("ws::")
      ) {
        logEvent("postMessage", e.data.type, e.data.payload || e.data);
      }
    });
  };

  const toggleCollapse = () => {
    state.isCollapsed = !state.isCollapsed;
  };

  const clearLogs = (e: Event) => {
    e.stopPropagation();
    state.eventCount = 0;
    state.allLogs = [];
  };

  const copyLogs = (e: Event) => {
    e.stopPropagation();
    const logText = state.allLogs
      .map((log) => {
        const detailStr = log.detail
          ? typeof log.detail === "object"
            ? JSON.stringify(log.detail, null, 2)
            : log.detail
          : "";
        return `[${log.timestamp}] ${log.eventName} (${log.eventType})\n${detailStr}`;
      })
      .join("\n\n---\n\n");

    navigator.clipboard.writeText(logText).then(() => {
      m.redraw();
      setTimeout(() => {
        m.redraw();
      }, 1500);
    });
  };

  const testMode = () => {
    if (window.location.search.includes("ws-test=true")) {
      setTimeout(() => {
        console.log("[WS Dev Log] Test mode enabled - emitting test events");
        window.dispatchEvent(
          new CustomEvent("ws::test:init", { detail: { status: "ready" } })
        );

        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("ws::action:editFlow", {
              detail: { flowId: "test-123", name: "Test Flow" },
            })
          );
        }, 1000);

        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("ws::flow:updated", {
              detail: { id: "test-123", changes: ["name", "description"] },
            })
          );
        }, 2000);
      }, 500);
    }
  };

  return {
    oncreate: () => {
      setupEventListeners();
      testMode();
    },

    view: () => {
      return m(
        "#ws-dev-log",
        {
          style: {
            position: "fixed",
            bottom: 0,
            right: 0,
            width: "400px",
            maxHeight: "50vh",
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "8px 8px 0 0",
            fontFamily: "monospace",
            fontSize: "12px",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.3)",
          },
        },
        [
          // Header
          m(
            "#ws-log-header",
            {
              style: {
                padding: "8px 12px",
                background: "#2a2a2a",
                borderBottom: "1px solid #333",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                userSelect: "none",
              },
              onclick: (e: Event) => {
                if (
                  (e.target as HTMLElement).tagName === "BUTTON" ||
                  (e.target as HTMLElement).closest("button")
                ) {
                  return;
                }
                toggleCollapse();
              },
            },
            [
              m("span", { style: { color: "#4CAF50", fontWeight: "bold" } }, [
                "🔍 WS Dev Events (",
                m("span#ws-log-count", state.eventCount),
                ")",
              ]),
              m("div", { style: { display: "flex", gap: "8px" } }, [
                m(
                  "button#ws-log-clear",
                  {
                    style: {
                      padding: "2px 8px",
                      background: "#444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "10px",
                    },
                    onclick: clearLogs,
                  },
                  "Clear"
                ),
                m(
                  "button#ws-log-copy",
                  {
                    style: {
                      padding: "2px 8px",
                      background: "#444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "10px",
                    },
                    onclick: copyLogs,
                  },
                  "Copy"
                ),
                m(
                  "span#ws-log-toggle",
                  { style: { color: "#888", fontSize: "16px" } },
                  state.isCollapsed ? "▲" : "▼"
                ),
              ]),
            ]
          ),

          // Content
          m(
            "#ws-log-content",
            {
              style: {
                overflowY: "auto",
                padding: "8px",
                color: "#e0e0e0",
                flex: 1,
                display: state.isCollapsed ? "none" : "block",
              },
              oncreate: (vnode: any) => {
                logContentEl = vnode.dom;
              },
            },
            state.allLogs.length === 0
              ? m(
                  "div",
                  { style: { color: "#888", fontStyle: "italic" } },
                  "Listening for ws:: events..."
                )
              : state.allLogs.map((log) =>
                  m(
                    "div",
                    {
                      style: {
                        marginBottom: "8px",
                        padding: "6px",
                        background: "#252525",
                        borderLeft: "3px solid #4CAF50",
                        borderRadius: "3px",
                      },
                    },
                    [
                      m(
                        "div",
                        {
                          style: {
                            color: "#4CAF50",
                            fontWeight: "bold",
                            marginBottom: "4px",
                          },
                        },
                        [
                          `[${log.timestamp}] ${log.eventName}`,
                          m(
                            "span",
                            {
                              style: {
                                marginLeft: "8px",
                                padding: "2px 6px",
                                background: "#333",
                                borderRadius: "3px",
                                fontSize: "10px",
                                color: "#888",
                              },
                            },
                            log.eventType
                          ),
                        ]
                      ),
                      log.detail !== undefined && log.detail !== null
                        ? m(
                            "div",
                            {
                              style: {
                                color: "#aaa",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-all",
                                maxHeight: "200px",
                                overflowY: "auto",
                                fontSize: "11px",
                                marginTop: "4px",
                                padding: "4px",
                                background: "#1a1a1a",
                                borderRadius: "2px",
                              },
                            },
                            (() => {
                              try {
                                return typeof log.detail === "object"
                                  ? JSON.stringify(log.detail, null, 2)
                                  : String(log.detail);
                              } catch (e) {
                                return "[Circular or non-serializable data]";
                              }
                            })()
                          )
                        : null,
                    ]
                  )
                )
          ),
        ]
      );
    },
  };
};
