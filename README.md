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

The shared code in `src/shared/` is published to [JSR (JavaScript Registry)](https://jsr.io/) for use by other projects.

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

This will publish the `@waystation/shared` package to JSR based on the configuration in `jsr.json`.

### Installing from JSR

To use the shared Waystation components in your project:

**Using Deno:**

```typescript
import { dispatch, _events } from "jsr:@waystation/shared/utils";
import { Flow } from "jsr:@waystation/shared/ws-flow-page";
import { FlowList } from "jsr:@waystation/shared/ws-flow-list-page";
```

**Using Node.js/npm:**

```bash
npx jsr add @waystation/shared
```

Then import in your code:

```typescript
import { dispatch, _events } from "@waystation/shared/utils";
import { Flow } from "@waystation/shared/ws-flow-page";
import { FlowList } from "@waystation/shared/ws-flow-list-page";
```

### Available Exports

The following modules are exported from `@waystation/shared`:

- `utils` - Utility functions (dispatch, debounce, event constants)
- `ws-flow-page` - Flow page component
- `ws-flow-list-page` - Flow list page component
- `ws-marked` - Markdown renderer wrapper
- `ws-hljs` - Syntax highlighter wrapper
- `ws-svg` - SVG icon definitions

## Dependencies

The shared code depends on:

- **mithril** - Frontend framework
- **marked** - Markdown parser
- **highlight.js** - Syntax highlighting
- **overtype** - Rich text editor

Make sure these are installed in projects using `@waystation/shared`.

## License

See LICENSE file for details.
