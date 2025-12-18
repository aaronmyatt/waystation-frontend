# waystation-frontend

A multi-target frontend framework for Waystation, supporting web, VSCode extensions, and browser extensions.

## Project Structure

```
waystation-frontend/
├── src/
│   ├── shared/           # Shared code for all build targets
│   │   ├── utils.ts
│   │   ├── ws-flow-page.ts
│   │   ├── ws-flow-list-page.ts
│   │   ├── ws-marked.ts
│   │   ├── ws-hljs.ts
│   │   ├── ws-svg.ts
│   │   └── global.d.ts
│   └── vscode-extension/ # VSCode extension specific code
│       ├── index.ts
│       └── style.css
├── jsr.json             # JSR package configuration
└── rollup.config.js     # Build configuration
```

## Build Targets

This repository supports multiple build targets:

- **VSCode Extension** - Currently implemented in `src/vscode-extension/`
- **Web Application** - (Coming soon)
- **Chrome Browser Extension** - (Coming soon)

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Build

Build the VSCode extension:

```bash
npm run build
```

Build for production:

```bash
npm run build:prod
```

### Development Mode

Run in development mode with live reload:

```bash
npm run dev
```

Serve with HTTP server:

```bash
npm run serve
```

## JSR Package Distribution

Both the shared code in `src/shared/` and the VSCode extension bundle in `src/vscode-extension/` are published to [JSR (JavaScript Registry)](https://jsr.io/) for use by other projects.

### Publishing to JSR

1. **Install JSR CLI** (if not already installed):

```bash
npm install -g jsr
```

2. **Build the package**:

```bash
npm run build
```

3. **Publish to JSR**:

```bash
jsr publish
```

This will publish the `@waystation/frontend` package to JSR based on the configuration in `jsr.json`.

### Installing from JSR

To use the Waystation components in your project:

**Using Deno:**

```typescript
// Shared components
import { dispatch, _events } from "jsr:@waystation/frontend/shared/utils";
import { Flow } from "jsr:@waystation/frontend/shared/ws-flow-page";
import { FlowList } from "jsr:@waystation/frontend/shared/ws-flow-list-page";

// VSCode extension bundle (includes all UI components)
import "jsr:@waystation/frontend/vscode-extension";
import "jsr:@waystation/frontend/vscode-extension/style.css";
```

**Using Node.js/npm:**

```bash
npx jsr add @waystation/frontend
```

Then import in your code:

```typescript
// Shared components
import { dispatch, _events } from "@waystation/frontend/shared/utils";
import { Flow } from "@waystation/frontend/shared/ws-flow-page";
import { FlowList } from "@waystation/frontend/shared/ws-flow-list-page";

// VSCode extension bundle (includes all UI components)
import "@waystation/frontend/vscode-extension";
import "@waystation/frontend/vscode-extension/style.css";
```

### Available Exports

The following modules are exported from `@waystation/frontend`:

#### Shared Components
- `shared/utils` - Utility functions (dispatch, debounce, event constants)
- `shared/ws-flow-page` - Flow page component
- `shared/ws-flow-list-page` - Flow list page component
- `shared/ws-marked` - Markdown renderer wrapper
- `shared/ws-hljs` - Syntax highlighter wrapper
- `shared/ws-svg` - SVG icon definitions

#### VSCode Extension Bundle
- `vscode-extension` - Complete VSCode extension frontend (includes routing, layout, and all UI components)
- `vscode-extension/style.css` - VSCode extension styles

## Dependencies

Both the shared components and the VSCode extension bundle depend on:

- **mithril** - Frontend framework
- **marked** - Markdown parser
- **highlight.js** - Syntax highlighting
- **overtype** - Rich text editor

Make sure these are installed in projects using `@waystation/frontend`.

## License

See LICENSE file for details.
