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

```bash
deno add jsr:@waystation/frontend
```

**Using Node.js/npm:**

```bash
npx jsr add @waystation/frontend
```

### Quick Start (Recommended)

The easiest way to use Waystation is to import the bundled JavaScript and CSS:

```typescript
// Import the complete VSCode extension bundle (includes all UI components)
import "@waystation/frontend/vscode-extension";
```

```html
<!-- Include the bundled styles -->
<link rel="stylesheet" href="path/to/style.css">
```

Or if your bundler supports CSS imports:

```typescript
import "@waystation/frontend/vscode-extension";
import "@waystation/frontend/vscode-extension/style.css";
```

This gives you access to all Waystation components with a single import.

### Individual Component Imports

For advanced users who want more granular control, you can import specific shared components:

<details>
<summary>Click to expand advanced import options</summary>

**Individual Component Imports:**

```typescript
// Utility functions
import { dispatch, _events } from "@waystation/frontend/shared/utils";

// Specific page components
import { Flow } from "@waystation/frontend/shared/ws-flow-page";
import { FlowList } from "@waystation/frontend/shared/ws-flow-list-page";

// Markdown and syntax highlighting
import { marked } from "@waystation/frontend/shared/ws-marked";
import { hljs } from "@waystation/frontend/shared/ws-hljs";

// SVG icons
import { SVGDefs } from "@waystation/frontend/shared/ws-svg";
```

**Note:** When importing individual components, you may need to handle initialization and dependencies yourself. The bundled import (recommended above) handles this automatically.

</details>

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
- `vscode-extension/style.css` - VSCode extension styles (must be imported separately, see [CSS Styles](#css-styles))

## Dependencies

Both the shared components and the VSCode extension bundle depend on:

- **mithril** - Frontend framework
- **marked** - Markdown parser
- **highlight.js** - Syntax highlighting
- **overtype** - Rich text editor

Make sure these are installed in projects using `@waystation/frontend`.

## License

See LICENSE file for details.

## VSCode Settings
Configure VSCode to ignore the `dist/` directory by adding the following to your `.vscode/settings.json`:

```json
  "files.exclude": {
    "**/dist/**": true
  },
  "search.exclude": {
    "**/dist/**": true
  },
  "files.watcherExclude": {
    "**/dist/**": true
  }
```
