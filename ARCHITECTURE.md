# Waystation Frontend Architecture

## Overview

Waystation Frontend is a **client-agnostic multi-target frontend framework** that supports multiple deployment targets from a single shared codebase:

- **VSCode Extension** - Embedded webview UI within VSCode
- **Web Application** - Standalone web application
- **Browser Extension** - (Future) Chrome/Firefox extensions

The architecture achieves client-agnosticism through:
1. **Shared UI Components** - Platform-independent components in `src/shared/`
2. **Event-driven Communication** - CustomEvents API for loose coupling
3. **Service Layer Abstraction** - Global services for state management
4. **Target-specific Entry Points** - Minimal platform-specific code in `src/vscode-extension/` and `src/web/`

## Project Structure

```
waystation-frontend/
├── src/
│   ├── shared/              # Client-agnostic components (core)
│   │   ├── utils.ts         # Event dispatch, debounce utilities
│   │   ├── ws-flow-page.ts  # Flow editor component
│   │   ├── ws-flow-list-page.ts  # Flow list component
│   │   ├── ws-marked.ts     # Markdown renderer wrapper
│   │   ├── ws-hljs.ts       # Syntax highlighter wrapper
│   │   └── ws-svg.ts        # SVG icon definitions
│   ├── vscode-extension/    # VSCode-specific entry point
│   │   ├── index.ts         # VSCode routing & initialization
│   │   └── style.css        # VSCode theme styles
│   └── web/                 # Web-specific entry point
│       ├── index.ts         # Web routing & initialization
│       └── style.css        # Web theme styles
├── dist/                    # Build outputs
│   ├── waystation-vscode.js
│   ├── waystation-vscode.css
│   ├── waystation-web.js
│   └── waystation-web.css
└── rollup.config.js         # Build configuration
```

## Current Event Flow Architecture

The application uses a **unidirectional event-driven architecture** where UI components dispatch events through the global `CustomEvent` API, and the host environment (VSCode extension or web backend) listens and responds.

### Event Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        HOST ENVIRONMENT                           │
│                (VSCode Extension / Web Backend)                   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Event Listeners (addEventListener)               │   │
│  │  • ws::action::requestFlow                               │   │
│  │  • ws::action::refreshList                               │   │
│  │  • ws::flow::updated                                     │   │
│  │  • ws::action::export                                    │   │
│  │  • ws::action::generateFlowContent                       │   │
│  │  • ws::action::deleteFlow                                │   │
│  │  • ws::action::createChildFlow                           │   │
│  │  • ws::action::clickFlowMatch                            │   │
│  │  • ws::action::insertFlowMatchAfter                      │   │
│  │  • ws::action::actionError                               │   │
│  └────────────┬────────────────────────────────┬────────────┘   │
│               │ Backend Processing              │                │
│               ▼                                 ▼                │
│     ┌─────────────────┐              ┌──────────────────┐       │
│     │  Persistence    │              │  External APIs   │       │
│     │  • SQLite       │              │  • AI Services   │       │
│     │  • File System  │              │  • Git repos     │       │
│     └────────┬────────┘              └────────┬─────────┘       │
│              │                                 │                 │
│              └─────────────┬───────────────────┘                 │
│                            ▼                                     │
│            ┌────────────────────────────────┐                    │
│            │  Response via Service Methods  │                    │
│            │  • flowService.load()          │                    │
│            │  • flowService.updateFlow()    │                    │
│            │  • flowListService.load()      │                    │
│            └────────────────┬───────────────┘                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND APPLICATION                           │
│                  (Waystation-Frontend Bundle)                     │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  Global Services                           │  │
│  │  ┌──────────────────────┐    ┌──────────────────────┐    │  │
│  │  │   FlowService        │    │  FlowListService     │    │  │
│  │  │  • _flow (state)     │    │  • _flows (state)    │    │  │
│  │  │  • load()            │    │  • load()            │    │  │
│  │  │  • updateFlow()      │    │  • flows (getter)    │    │  │
│  │  │  • updateFlowMatch() │    │                      │    │  │
│  │  │  • moveFlowMatchUp() │    │                      │    │  │
│  │  │  • deleteFlowMatch() │    │                      │    │  │
│  │  │  • dispatchUpdated() │    │                      │    │  │
│  │  └──────────┬───────────┘    └───────────┬──────────┘    │  │
│  └─────────────┼────────────────────────────┼───────────────┘  │
│                │                             │                   │
│                └──────────┬──────────────────┘                   │
│                           │                                      │
│  ┌────────────────────────┼──────────────────────────────────┐  │
│  │          Mithril UI Components                            │  │
│  │           │                                                │  │
│  │  ┌────────┼───────────────────────────────────────────┐   │  │
│  │  │  Flow Editor (ws-flow-page.ts)                     │   │  │
│  │  │        │                                            │   │  │
│  │  │  ┌─────▼──────┐  ┌──────────────┐  ┌────────────┐ │   │  │
│  │  │  │  Flow      │  │ FlowMatchList│  │ FlowMatch  │ │   │  │
│  │  │  │  • Title   │  │              │  │            │ │   │  │
│  │  │  │  • Desc    │  │  ┌───────────▼──▼─────────┐  │ │   │  │
│  │  │  │  • Toolbar │  │  │  FlowMatchToolbar      │  │ │   │  │
│  │  │  └─────┬──────┘  │  │  • Edit / Save         │  │ │   │  │
│  │  │        │         │  │  • Move Up/Down        │  │ │   │  │
│  │  │        │         │  │  • Generate            │  │ │   │  │
│  │  │        │         │  │  • Delete              │  │ │   │  │
│  │  │        │         │  │  • Create Child Flow   │  │ │   │  │
│  │  │        │         │  └────────────────────────┘  │ │   │  │
│  │  │        │         └─────────────────────────────┘ │   │  │
│  │  │        │                                          │   │  │
│  │  │        └──► User Actions ──┐                     │   │  │
│  │  │                             │                     │   │  │
│  │  └─────────────────────────────┼─────────────────────┘   │  │
│  │                                │                          │  │
│  │  ┌─────────────────────────────┼─────────────────────┐   │  │
│  │  │  Flow List (ws-flow-list-page.ts)               │   │  │
│  │  │        │                    │                     │   │  │
│  │  │  ┌─────▼──────┐             │                     │   │  │
│  │  │  │  FlowList  │             │                     │   │  │
│  │  │  │  • Grid    │             │                     │   │  │
│  │  │  │  • Cards   │             │                     │   │  │
│  │  │  └─────┬──────┘             │                     │   │  │
│  │  │        │                    │                     │   │  │
│  │  │        └──► User Actions ───┤                     │   │  │
│  │  │                             │                     │   │  │
│  │  └─────────────────────────────┼─────────────────────┘   │  │
│  │                                │                          │  │
│  │  ┌─────────────────────────────┼─────────────────────┐   │  │
│  │  │    Routing Layer (index.ts) │                     │   │  │
│  │  │                             │                     │   │  │
│  │  │  • /                  ──────┼──► FlowList         │   │  │
│  │  │  • /flow/new          ──────┼──► Flow (new)       │   │  │
│  │  │  • /flow/:id          ──────┼──► Flow (existing)  │   │  │
│  │  │                             │                     │   │  │
│  │  └─────────────────────────────┼─────────────────────┘   │  │
│  │                                │                          │  │
│  └────────────────────────────────┼──────────────────────────┘  │
│                                   │                             │
│  ┌────────────────────────────────▼──────────────────────────┐  │
│  │         Event Dispatcher (utils.ts)                       │  │
│  │                                                            │  │
│  │  dispatch(eventName, data) {                              │  │
│  │    globalThis.dispatchEvent(                              │  │
│  │      new CustomEvent(eventName, { detail: data })         │  │
│  │    )                                                       │  │
│  │  }                                                         │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                   │                             │
│                                   │ CustomEvent                 │
│                                   ▼                             │
└───────────────────────────────────┼─────────────────────────────┘
                                    │
                                    │ (Events bubble up to host)
                                    │
                                    ▼
                            [Back to Host Environment]
```

### Event Categories

**Flow Actions**
- `ws::flow::updated` - Flow or flow match data changed
- `ws::action::export` - Export flow data
- `ws::action::generateFlowContent` - Generate AI description for flow
- `ws::action::deleteFlow` - Delete entire flow
- `ws::action::requestFlow` - Request specific flow by ID
- `ws::action::refreshList` - Refresh flow list
- `ws::action::actionError` - Error occurred during action

**Flow Match Actions**
- `ws::action::generateFlowMatchContent` - Generate AI description for match
- `ws::action::insertFlowMatchAfter` - Insert match at position
- `ws::action::createChildFlow` - Create child flow from match
- `ws::click::flowMatch` - User clicked on a flow match

## Current Data Flow Architecture

The data flows in a unidirectional pattern from the host environment through services to UI components.

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HOST ENVIRONMENT                              │
│                                                                       │
│  ┌────────────────────────┐          ┌───────────────────────────┐  │
│  │   Data Persistence     │          │   External Data Sources   │  │
│  │   • SQLite Database    │          │   • File System          │  │
│  │   • Local Storage      │          │   • Git Repositories     │  │
│  └───────────┬────────────┘          └────────────┬──────────────┘  │
│              │                                     │                 │
│              └──────────────┬──────────────────────┘                 │
│                             │                                        │
│                             ▼                                        │
│              ┌──────────────────────────────┐                        │
│              │  Data Transformation Layer   │                        │
│              │  • Format to Flow objects    │                        │
│              │  • Validate data structure   │                        │
│              └──────────────┬───────────────┘                        │
│                             │                                        │
│                             │ via postMessage / API                  │
│                             │                                        │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND APPLICATION                             │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  Service Layer (Global Scope)                 │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │ FlowService (globalThis.flowService)                 │    │  │
│  │  │                                                       │    │  │
│  │  │  State:                                              │    │  │
│  │  │  _flow: {                                            │    │  │
│  │  │    flow: { id?, name, description }                 │    │  │
│  │  │    matches: [{                                       │    │  │
│  │  │      flow_match_id,                                  │    │  │
│  │  │      content_kind: "note" | "match",                │    │  │
│  │  │      note?: { name, description },                   │    │  │
│  │  │      step_content?: { title, body },                │    │  │
│  │  │      match: { file_name, grep_meta },               │    │  │
│  │  │      order_index                                     │    │  │
│  │  │    }]                                                 │    │  │
│  │  │  }                                                    │    │  │
│  │  │                                                       │    │  │
│  │  │  Methods:                                            │    │  │
│  │  │  • load(flow)        - Load complete flow object    │    │  │
│  │  │  • updateFlow()      - Update flow metadata         │    │  │
│  │  │  • updateFlowMatch() - Update specific match        │    │  │
│  │  │  • deleteFlowMatch() - Remove match                 │    │  │
│  │  │  • moveFlowMatchUp() - Reorder match up             │    │  │
│  │  │  • moveFlowMatchDown() - Reorder match down         │    │  │
│  │  │  • addNoteStep()     - Insert new note              │    │  │
│  │  │  • reset()           - Initialize new flow          │    │  │
│  │  │  • clear()           - Empty state                  │    │  │
│  │  │  • dispatchUpdated() - Emit update event            │    │  │
│  │  └───────────────────────┬───────────────────────────┘    │  │
│  │                          │                                 │  │
│  │  ┌───────────────────────▼───────────────────────────┐    │  │
│  │  │ FlowListService (globalThis.flowListService)      │    │  │
│  │  │                                                    │    │  │
│  │  │  State:                                           │    │  │
│  │  │  _flows: [{                                       │    │  │
│  │  │    id, name, description, updated_at              │    │  │
│  │  │  }]                                                │    │  │
│  │  │                                                    │    │  │
│  │  │  Methods:                                         │    │  │
│  │  │  • load(flows) - Load flow list                  │    │  │
│  │  │  • flows (getter) - Get flow array               │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                           │                                      │
│                           │ State flows down                     │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Mithril Component Tree                     │    │
│  │                                                          │    │
│  │  Route: /                                               │    │
│  │    Layout                                               │    │
│  │      └─► FlowList                                       │    │
│  │            └─► FlowCard (for each flow)                 │    │
│  │                  • Displays: name, description          │    │
│  │                  • Reads: flowListService.flows         │    │
│  │                                                          │    │
│  │  Route: /flow/:id                                       │    │
│  │    Layout                                               │    │
│  │      └─► Flow                                           │    │
│  │            ├─► FlowToolbar                              │    │
│  │            ├─► FlowDescriptionEditor                    │    │
│  │            │     • Reads: flowService.flow.description  │    │
│  │            │     • Updates: via updateFlow()            │    │
│  │            └─► FlowMatchList                            │    │
│  │                  └─► FlowMatch (for each match)         │    │
│  │                        ├─► FlowMatchToolbar             │    │
│  │                        ├─► FlowMatchDescriptionEditor   │    │
│  │                        ├─► FlowMatchCodeBlock           │    │
│  │                        └─► FlowMatchInsertBetween       │    │
│  │                                                          │    │
│  │  Data binding:                                          │    │
│  │    • Component reads service state                      │    │
│  │    • User interaction calls service methods             │    │
│  │    • Service methods update state                       │    │
│  │    • Service dispatches update event                    │    │
│  │    • Mithril redraws UI automatically                   │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           │ User interactions                    │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               Event Emission Layer                      │    │
│  │                                                          │    │
│  │  • User edits flow → updateFlow() → dispatchUpdated()  │    │
│  │  • User clicks button → dispatch(eventName, data)      │    │
│  │  • User navigates → dispatch(requestFlow, {id})        │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            │ CustomEvents bubble to host
                            ▼
                     [Back to Host Environment]
```

### Data Flow Sequence: Loading a Flow

```
[Host] ──1. User navigates to /flow/123──► [Frontend Router]
                                                    │
                                                    │ 2. onmatch()
                                                    ▼
                                          dispatch(requestFlow, {id:123})
                                                    │
                                                    │ 3. Event bubbles
                                                    ▼
[Host] ◄────────────────────────────────────────────┘
  │
  │ 4. addEventListener catches event
  │ 5. Queries database for flow #123
  │ 6. Fetches flow data
  │
  └──7. flowService.load(flowData)──► [FlowService]
                                            │
                                            │ 8. Updates _flow state
                                            │ 9. Triggers m.redraw()
                                            ▼
                                      [Flow Component]
                                            │
                                            │ 10. Renders with new data
                                            ▼
                                       [User sees flow]
```

### Data Flow Sequence: Updating a Flow

```
[User] ──1. Edits flow title──► [Flow Component]
                                       │
                                       │ 2. oninput handler
                                       ▼
                           flowService.updateFlow({...flow, name})
                                       │
                                       ├─► 3a. Updates _flow state
                                       │
                                       └─► 3b. dispatchUpdated()
                                                    │
                                                    │ 4. CustomEvent
                                                    ▼
[Host] ◄────────────────────────────────────────────┘
  │
  │ 5. addEventListener catches ws::flow::updated
  │ 6. Persists to database
  │
  └──────────────────────────────────────────────────► [Saved]
```

## Client-Agnostic Design Patterns

### 1. Event-Driven Communication

The frontend never directly calls host APIs. Instead, it emits events:

```typescript
// In frontend code (client-agnostic)
export function dispatch(eventName: string, data?: any): boolean {
  return globalThis.dispatchEvent(
    new CustomEvent(eventName, { detail: data || {} })
  );
}

// Example usage
dispatch(_events.action.requestFlow, { flowId: '123' });
```

**Benefits:**
- ✅ No platform-specific imports
- ✅ Works in any JavaScript environment
- ✅ Host can implement handlers differently per platform

### 2. Global Service Pattern

State management through global singleton services:

```typescript
// Services attached to globalThis for universal access
globalThis.flowService = new FlowService();
globalThis.flowListService = new FlowListService();
```

**Benefits:**
- ✅ No dependency injection needed
- ✅ Accessible from any component
- ✅ Consistent across all platforms

### 3. Separation of Concerns

```
Shared Components (src/shared/)
├── Pure UI logic
├── Event emission
└── Service calls

Platform Entry Points (src/vscode-extension/, src/web/)
├── Routing configuration
├── Layout/theme
├── Event listeners (platform-specific)
└── Backend integration (platform-specific)
```

**Benefits:**
- ✅ Maximize code reuse (>95% shared)
- ✅ Platform-specific code isolated to entry points
- ✅ Easy to add new platforms

### 4. Data Structure Contracts

Services enforce consistent data structures:

```typescript
interface FlowData {
  flow: {
    id?: string;
    name: string;
    description: string;
  };
  matches: FlowMatch[];
}
```

**Benefits:**
- ✅ Platform backends must conform to same schema
- ✅ Type safety across the stack
- ✅ Easy to validate and transform

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | Mithril.js | Lightweight, client-agnostic view layer |
| **Styling** | TailwindCSS + DaisyUI | Utility-first CSS, themeable |
| **State** | Service Pattern | Centralized state in global services |
| **Events** | CustomEvent API | Platform-independent communication |
| **Routing** | Mithril Router | Client-side navigation |
| **Markdown** | marked.js | Markdown parsing |
| **Syntax Highlighting** | highlight.js | Code block highlighting |
| **Rich Text** | OverType | Markdown editor with live preview |
| **Build** | Rollup | Bundling for multiple targets |
| **Types** | TypeScript | Type safety across codebase |

## Build System

The build system uses Rollup to create platform-specific bundles from shared source code:

```
┌─────────────────────────────────────────────────────────────┐
│                   Source Code (TypeScript)                   │
│                                                              │
│  ┌──────────────┐   ┌─────────────────────────────────┐    │
│  │ src/shared/  │   │ Platform-specific entry points  │    │
│  │  (95% code)  │   │                                 │    │
│  └──────┬───────┘   │  ┌───────────┐  ┌───────────┐  │    │
│         │           │  │  vscode-  │  │    web/   │  │    │
│         │           │  │ extension/│  │  index.ts │  │    │
│         └───────────┼─►│ index.ts  │  └─────┬─────┘  │    │
│                     │  └─────┬─────┘        │        │    │
│                     └────────┼──────────────┼────────┘    │
└──────────────────────────────┼──────────────┼─────────────┘
                               │              │
                    ┌──────────▼──────────┐   │
                    │  rollup.config.js   │   │
                    │  (VSCode target)    │   │
                    └──────────┬──────────┘   │
                               │              │
                    ┌──────────▼──────────────▼──────────┐
                    │  rollup.web.config.js              │
                    │  (Web target)                      │
                    └──────────┬─────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Build Outputs (dist/)                       │
│                                                              │
│  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │  VSCode Bundle         │  │  Web Bundle              │  │
│  │  • waystation-vscode.js│  │  • waystation-web.js     │  │
│  │  • waystation-vscode   │  │  • waystation-web.css    │  │
│  │    .css                │  │                          │  │
│  │  • IIFE format         │  │  • IIFE format           │  │
│  │  • Optimized for       │  │  • Optimized for browser │  │
│  │    webview             │  │                          │  │
│  └────────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Build Commands

```bash
# VSCode extension bundle
npm run build          # Development build
npm run build:prod     # Production build (minified)
npm run dev            # Watch mode

# Web bundle
npm run build:web      # Development build
npm run dev:web        # Watch mode

# Both targets
npm run build:all      # Both dev builds
npm run build:all:prod # Both production builds
```

## Platform-Specific Implementations

### VSCode Extension Integration

The VSCode extension host listens for events and communicates with the webview:

```typescript
// In VSCode extension (outside this repo)
panel.webview.onDidReceiveMessage((event) => {
  switch(event.type) {
    case 'ws::action::requestFlow':
      const flow = await db.getFlow(event.detail.flowId);
      panel.webview.postMessage({
        command: 'loadFlow',
        flow: flow
      });
      break;
    // ... other handlers
  }
});

// Frontend receives via window message
window.addEventListener('message', (event) => {
  if (event.data.command === 'loadFlow') {
    globalThis.flowService.load(event.data.flow);
  }
});
```

### Web Application Integration

The web application uses HTTP/WebSocket for backend communication:

```typescript
// In web backend (outside this repo)
window.addEventListener('ws::action::requestFlow', async (event) => {
  const { flowId } = event.detail;
  const response = await fetch(`/api/flows/${flowId}`);
  const flow = await response.json();
  globalThis.flowService.load(flow);
});
```

## Key Characteristics of Client-Agnostic Design

1. **No Platform Dependencies**: Shared components import only cross-platform libraries (mithril, marked, highlight.js)

2. **Event-Based API Contract**: All platform communication happens through documented CustomEvent contracts

3. **Service-Based State**: State management is centralized in services, not tied to any platform store

4. **Declarative UI**: Mithril components are pure functions of state, no platform-specific rendering

5. **Shared Build Artifacts**: The same compiled JavaScript works across all platforms with different entry points

6. **Theme Adaptability**: CSS uses CSS variables allowing platform-specific themes without code changes

7. **Minimal Entry Points**: Platform-specific code limited to:
   - Routing configuration
   - Event listener setup
   - Initial data loading
   - Theme/styling overrides

This architecture allows Waystation to maintain a single UI codebase while supporting multiple deployment targets with minimal duplication.
