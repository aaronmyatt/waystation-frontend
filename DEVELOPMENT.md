# Waystation Frontend Development Guide

## Code Quality Tools

### Available Scripts

```bash
# Type checking
npm run type-check          # Check TypeScript types without building

# Linting
npm run lint                # Check code style and quality
npm run lint:fix            # Auto-fix linting issues

# Validation (runs both)
npm run validate            # Run type-check + lint

# Building
npm run build:web           # Build web bundle
npm run build:vscode        # Build VSCode extension
npm run build4prod          # Production build
```

### Before Committing

**Always run before committing:**
```bash
npm run validate            # Check types and linting
npm run build:web           # Ensure build works
```

### TypeScript Errors to Fix

Current errors (90+ total):

1. **Mithril Component State** - Properties not typed correctly
   - Files: `ws-auth.ts`, `ws-flow.ts`, `ws-flows.ts`
   - Issue: `vnode.state.propertyName` not recognized
   - Fix: Add proper interface for component state

2. **Implicit `any` Types**
   - Files: Multiple files with event handlers
   - Issue: Parameters like `(e)` should be `(e: Event)`
   - Fix: Add explicit types to all parameters

3. **Missing `@types/node`**
   - File: `api-client.ts`
   - Issue: `process.env` not recognized
   - Fix: Install `@types/node` OR use string literal

### ESLint Configuration

Located in `eslint.config.js` with rules:
- Warn on `any` types
- Warn on unused variables
- Allow flexible function return types

### TypeScript Configuration

`tsconfig.json` settings:
- `noEmit`: true (type-checking only)
- Strict mode disabled for gradual migration
- Module: ES2022

## Current Issues

### Priority 1: Component State Typing
All Mithril components need state interfaces:

```typescript
interface AuthState {
  mode: 'login' | 'register';
  email: string;
  password: string;
  // ... etc
}

export const Auth: m.Component<{}, AuthState> = {
  oninit(vnode) {
    vnode.state.mode = 'login'; // Now typed!
  }
}
```

### Priority 2: Event Handler Types
Replace all `(e)` with proper types:

```typescript
// Before
onclick: (e) => { ... }

// After
onclick: (e: Event) => { ... }
// or
onclick: (e: MouseEvent) => { ... }
```

### Priority 3: Function Parameters
Add types to all function parameters:

```typescript
// Before
load(flows) { ... }

// After  
load(flows: Flow[]) { ... }
```

## Claude Code Integration

Settings in `.claude/settings.local.json` allow:
- npm run commands
- Build scripts
- Type checking
- Linting
- Git operations

**Note:** Always run `npm run validate` before requesting commits!
