# Waystation Frontend

> **Learn, document and navigate codebases with ease.**

Waystation is a comprehensive tool for exploring and documenting complex codebases. This repository contains the frontend UI components used across multiple platforms:

- 🌐 **Web Application** ([waystation.aaronmyatt.com](https://waystation.aaronmyatt.com)) - Sync, share, and access your flows from anywhere
- 🔌 **VSCode Extension** - Create and navigate flows directly in your editor
- 📦 **NPM Package** - Reusable UI components published to [JSR](https://jsr.io/@waystation/frontend)

## What is Waystation?

Waystation helps you understand and document code by creating **flows** - collections of bookmarked lines across files and repositories. Think of flows as guided tours through your codebase that:

- 📍 **Bookmark** specific lines of code with context and notes
- 🗂️ **Organize** related code snippets into meaningful narratives
- 🚀 **Navigate** instantly to any bookmarked location with a single click
- 📝 **Export** as markdown for documentation or LLM prompts
- 🔄 **Sync** across devices using the web service
- 🤝 **Share** with your team or the community

[Maximum ***serendipity***, minimum friction.](https://en.wikipedia.org/wiki/Serendipity)

## Features

### 🌐 Web Application

The web interface at [waystation.aaronmyatt.com](https://waystation.aaronmyatt.com) provides:

- **Cloud Sync** - Access your flows from any device
- **Public Flows** - Browse and discover flows shared by the community
- **Repository Filtering** - View flows organized by repository
- **Flow Management** - Create, edit, and organize your flows online
- **Markdown Preview** - View flows with syntax highlighting and rich formatting
- **Export & Share** - Generate shareable links and markdown exports

### 🔌 VSCode Extension

The [Waystation VSCode extension](https://marketplace.visualstudio.com/items?itemName=waystation.waystation) provides:

- **Quick Bookmarking** - Right-click or use `Ctrl-K Ctrl-K` to add lines
- **Sidebar Integration** - Manage flows in the VSCode sidebar
- **In-Editor Preview** - View and edit flows without leaving your workspace
- **Instant Navigation** - Jump to bookmarked code with one click
- **Offline Support** - Works locally with optional sync to the web service

## Quick Start

### For End Users

1. **Install the VSCode Extension**
   - Search for "Waystation" in the VS Code Marketplace
   - Or [install from here](https://marketplace.visualstudio.com/items?itemName=waystation.waystation)

2. **Create a Flow**
   - Right-click on code and select "Add Line to Flow"
   - Or use the keyboard shortcut `Ctrl-Option-A` (Mac) / `Ctrl-Alt-A` (Windows/Linux)

3. **Navigate Your Flows**
   - View flows in the Waystation sidebar
   - Click any bookmarked line to jump to its location

4. **Sync to the Cloud** (Optional)
   - Create an account at [waystation.aaronmyatt.com](https://waystation.aaronmyatt.com)
   - In VS Code: Open Command Palette (`Cmd+Shift+P`) → "Waystation: Login"
   - Run "Waystation: Sync" to backup and share your flows

### For Developers

See the [Development](#development) section below.

## Project Structure

```
waystation-frontend/
├── src/
│   ├── shared/           # Shared UI components for all platforms
│   │   ├── ws-flow-page.ts
│   │   ├── ws-flow-list-page.ts
│   │   ├── ws-flow-editor.ts
│   │   └── ...
│   ├── vscode-extension/ # VSCode extension webview code
│   │   ├── index.ts
│   │   └── style.css
│   ├── web/              # Web application (waystation.aaronmyatt.com)
│   │   ├── index.ts
│   │   ├── integration.ts  # Backend API integration
│   │   └── style.css
│   └── pages/            # Page-level components
│       ├── ws-flows.ts
│       ├── ws-flow.ts
│       └── ...
├── dist/                 # Built bundles
├── jsr.json             # JSR package configuration
└── rollup.*.config.js   # Build configurations
```

## Build Targets

This repository supports multiple build targets:

- **Web Application** - Full-featured web interface with authentication and sync
- **VSCode Extension** - Embedded webview for the VSCode extension
- **NPM Package** - Reusable components published to JSR

## Development

### Prerequisites

- **Node.js 18+** and npm
- For local development with sync features, you'll need access to the Waystation backend API

### Installation

```bash
# Clone the repository
git clone https://github.com/aaronmyatt/waystation-frontend.git
cd waystation-frontend

# Install dependencies
npm install
```

### Build Commands

```bash
# Development mode with live reload (VSCode extension build)
npm run dev

# Development mode for web application
npm run dev:web

# Serve web application with live server
npm run serve

# Compare both builds side by side
npm run serve:compare

# Build VSCode extension for production
npm run build:vscode

# Build web application for production
npm run build:web

# Build everything for production
npm run build4prod

# Code quality checks
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
npm run type-check    # Run TypeScript type checking
npm run validate      # Run type-check and lint
```

### Project Scripts

- `npm run dev` - Watch mode for VSCode extension with hot reload
- `npm run dev:web` - Watch mode for web application
- `npm run serve` - Start HTTP server on port 3000
- `npm run serve:compare` - Run both dev modes and HTTP server for comparison
- `npm run build:vscode` - Build VSCode extension to `dist/waystation-vscode.js`
- `npm run build:web` - Build web application to `dist/waystation-web.js`
- `npm run build4prod` - Production build of all targets

### Development Workflow

1. **Working on shared components:**
   ```bash
   npm run dev  # or npm run dev:web
   ```
   Edit files in `src/shared/` and see changes reflected in real-time.

2. **Testing web application:**
   ```bash
   npm run serve
   ```
   Visit `http://localhost:3000/web.html` to see the web build.

3. **Comparing builds:**
   ```bash
   npm run serve:compare
   ```
   View VSCode build at `http://localhost:3000/` and web build at `http://localhost:3000/web.html`.

### Tech Stack

- **[Mithril.js](https://mithril.js.org/)** - Lightweight frontend framework
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[daisyUI 5](https://daisyui.com/)** - Tailwind CSS component library
- **[Marked](https://marked.js.org/)** - Markdown parser
- **[Highlight.js](https://highlightjs.org/)** - Syntax highlighting
- **[Overtype](https://github.com/aaronmyatt/overtype)** - Rich text editor
- **[Rollup](https://rollupjs.org/)** - Module bundler

## JSR Package Distribution

The Waystation frontend components are published to [JSR (JavaScript Registry)](https://jsr.io/@waystation/frontend) for use in other projects.

### Publishing to JSR

Publishing is typically handled by CI/CD, but you can manually publish:

```bash
# Build for production
npm run build4prod

# Publish to JSR
npx jsr publish
```

This publishes the `@waystation/frontend` package based on the configuration in `jsr.json`.

### Using Waystation in Your Project

#### Installation

**Using Deno:**
```bash
deno add jsr:@waystation/frontend
```

**Using Node.js/npm:**
```bash
npx jsr add @waystation/frontend
```

#### Quick Start (Recommended)

Import the complete bundle with all UI components:

```typescript
// Import the VSCode extension bundle (includes all components)
import "@waystation/frontend/vscode-extension";
import "@waystation/frontend/vscode-extension/style.css";
```

This provides access to all Waystation components with a single import.

#### Advanced Usage

For more granular control, import specific components:

```typescript
// Utility functions
import { dispatch, _events } from "@waystation/frontend/shared/utils";

// Page components
import { Flow } from "@waystation/frontend/shared/ws-flow-page";
import { FlowList } from "@waystation/frontend/shared/ws-flow-list-page";

// Markdown and syntax highlighting
import { marked } from "@waystation/frontend/shared/ws-marked";
import { hljs } from "@waystation/frontend/shared/ws-hljs";

// SVG icons
import { SVGDefs } from "@waystation/frontend/shared/ws-svg";
```

**Note:** Individual component imports require manual initialization and dependency management.

### Available Exports

#### Shared Components
- `shared/utils` - Utility functions (dispatch, debounce, event constants)
- `shared/ws-flow-page` - Flow page component
- `shared/ws-flow-list-page` - Flow list component
- `shared/ws-marked` - Markdown renderer wrapper
- `shared/ws-hljs` - Syntax highlighter wrapper
- `shared/ws-svg` - SVG icon definitions
- `shared/ws-overtype` - Rich text editor components

#### VSCode Extension Bundle
- `vscode-extension` - Complete VSCode extension frontend (routing, layout, all UI)
- `vscode-extension/style.css` - VSCode extension styles

#### Prebuilt Bundles
These files are included in the package and accessible via nested paths:
- `dist/waystation-vscode.js` / `dist/waystation-vscode.css`
- `dist/waystation-web.js` / `dist/waystation-web.css`

### Dependencies

Projects using `@waystation/frontend` should install these peer dependencies:

- **mithril** - Frontend framework
- **marked** - Markdown parser
- **highlight.js** - Syntax highlighting
- **overtype** - Rich text editor

## Architecture

### Event-Driven Design

Waystation uses a custom event system for loose coupling between components:

```typescript
import { dispatch, _events } from "@waystation/frontend/shared/utils";

// Dispatch events
dispatch(_events.flow.updated, { flowId: "123" });

// Listen for events
globalThis.addEventListener(_events.flow.updated, (event) => {
  console.log("Flow updated:", event.detail);
});
```

### Service Layer

Global services manage application state:

- `globalThis.flowService` - Current flow state
- `globalThis.flowListService` - List of flows
- `globalThis.authService` - Authentication state
- `globalThis.tagsListService` - Tags management

### API Integration

The web application integrates with a backend API:

```typescript
import { api } from "@waystation/frontend/shared/api-client";

// Fetch flows
const response = await api.flows.list();

// Get a specific flow
const flow = await api.flows.get(flowId);

// Update a flow
await api.flows.update(flowId, flowData);
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run `npm run validate` to check code quality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Run `npm run lint:fix` before committing
- Ensure `npm run validate` passes

## Related Projects

- **[Waystation VSCode Extension](https://github.com/aaronmyatt/waystation)** - The VSCode extension that uses this frontend
- **[Waystation Backend](https://github.com/aaronmyatt/waystation-backend)** - API server for sync and sharing features

## Common Use Cases

### Creating a Flow

1. Open your project in VS Code
2. Navigate to code you want to document
3. Right-click → "Add Line to Flow" or use `Ctrl-K Ctrl-K`
4. Add a title and notes for context
5. Repeat for related code snippets

### Exporting for LLMs

1. Open a flow in the preview panel
2. Click "Export as Markdown"
3. Copy the generated markdown
4. Paste into your favorite LLM for code analysis or documentation

### Sharing with Your Team

1. Create and organize your flows locally
2. Run "Waystation: Sync" to push to the cloud
3. Share the flow URL from [waystation.aaronmyatt.com](https://waystation.aaronmyatt.com)
4. Team members can view online or import into their VS Code

## License

See LICENSE file for details.
