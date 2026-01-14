---
description: SVG handling best practices for Mithril.js
alwaysApply: true
applyTo: "**"
version: latest
---

# SVG Handling Best Practices

This project centralizes SVG icons and uses Mithril.js's `m.trust()` method for rendering them.

## Adding New SVGs

All SVG icons should be added to the centralized SVG file:
- **File location**: [src/shared/ws-svg.ts](src/shared/ws-svg.ts)
- **Export format**: Export each SVG as a string constant with a descriptive name

### Example
```typescript
export const mySvg: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <!-- SVG content here -->
</svg>`;
```

## Rendering SVGs in Components

Always use `m.trust()` to render SVG strings in Mithril components. This method tells Mithril to trust the HTML string and render it as-is without escaping.

### Basic Usage
```typescript
import { copySvg, cogSvg } from './ws-svg';
import m from 'mithril';

// Render an SVG icon
m('span.size-4', m.trust(copySvg))
```

### Real-World Example
From [src/shared/ws-flows-list.ts](src/shared/ws-flows-list.ts):
```typescript
import { cogSvg, copySvg } from './ws-svg';

// Inside a component's view
m('button.btn btn-ghost btn-primary btn-circle btn-sm', {
  onclick: (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(_sharedEvents.flow.copyFlow, { flow: vnode.attrs.flow });
  },
  'aria-label': 'Copy flow'
}, m.trust(copySvg))
```

### Conditional SVG Rendering
```typescript
// Toggle between different SVGs based on state
m('span.block size-4 text-primary', 
  open ? m.trust(chevronDownSvg) : m.trust(chevronUpSvg)
)

// Conditional styling with SVG
vnode.attrs._tag.is_favourite 
  ? m('span.text-accent', m.trust(starSolid)) 
  : m.trust(star)
```

## Best Practices

1. **Centralization**: Always add SVGs to `ws-svg.ts` rather than inline in components
2. **Naming**: Use descriptive names ending with `Svg` (e.g., `copySvg`, `editSvg`, `cogSvg`)
3. **Styling**: Apply size and color classes to the wrapper element, not the SVG string
4. **Accessibility**: Always include `aria-label` attributes on buttons containing only SVG icons
5. **Reusability**: Check if an SVG already exists in `ws-svg.ts` before adding a new one
6. **Trust Safety**: Only use `m.trust()` with SVG strings from `ws-svg.ts` - never with user-provided content

## Common Patterns

### Icon Button
```typescript
m('button.btn btn-circle btn-sm', {
  onclick: handleClick,
  'aria-label': 'Settings'
}, m.trust(cogSvg))
```

### Icon with Text
```typescript
m('button.btn', [
  m('span.size-4 mr-2', m.trust(copySvg)),
  'Copy Flow'
])
```

### Sized Icon Container
```typescript
// Using Tailwind size utilities
m('span.size-4', m.trust(githubSvg))      // 16x16px
m('span.size-6', m.trust(starSolid))      // 24x24px
m('span.w-8 h-8', m.trust(plusSvg))       // 32x32px
```

### Colored Icon
```typescript
// Apply color classes to the wrapper
m('span.text-primary size-4', m.trust(plusSvg))
m('span.text-accent', m.trust(starSolid))
m('span.text-secondary', m.trust(upSvg))
```

## Why This Approach?

1. **Performance**: Inline SVGs are faster than external SVG files
2. **Maintainability**: Centralized location makes it easy to update or replace icons
3. **Type Safety**: TypeScript ensures SVG constants exist at compile time
4. **Consistency**: All SVGs follow the same pattern across the codebase
5. **Bundle Size**: Tree-shaking removes unused SVG exports in production builds
