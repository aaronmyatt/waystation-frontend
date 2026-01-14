---
description: Mithril.js routing utilities
alwaysApply: true
applyTo: "**"
version: latest
---

# Mithril.js Routing

This project uses Mithril.js for routing and navigation. Always use the `m.route` utilities when working with navigation and routing.

## m.route Interface

```typescript
interface Route {
    /** Creates application routes and mounts Components and/or RouteResolvers to a DOM element. */
    (element: Element, defaultRoute: string, routes: RouteDefs): void;
    /** Returns the last fully resolved routing path, without the prefix. */
    get(): string;
    /** Redirects to a matching route or to the default route if no matching routes can be found. */
    set(route: string, data?: any, options?: RouteOptions): void;
    /** Defines a router prefix which is a fragment of the URL that dictates the underlying strategy used by the router. */
    prefix: string;
    /** This Component renders a link <a href> that will use the current routing strategy */
    Link: Component<RouteLinkAttrs>;
    /** Returns the named parameter value from the current route. */
    param(name: string): string;
    /** Gets all route parameters. */
    param(): any;
    /** Special value to SKIP current route */
    SKIP: any;
}
```

## Usage Guidelines

### Navigation
- **Always use `m.route.set()`** for programmatic navigation instead of direct `window.location` manipulation
- **Use `m.route.Link`** component for navigation links instead of plain `<a>` tags when possible
- **Use `m.route.get()`** to get the current route path
- **Use `m.route.param()`** to access route parameters

### Route Definition
- Define routes using `m.route()` with a DOM element, default route, and route definitions
- Use `m.route.prefix` to set routing strategy (e.g., hash-based, pathname-based)

### Examples

#### Programmatic Navigation
```typescript
// Good - using m.route.set()
m.route.set('/flows/:id', { id: flowId });

// Bad - don't use direct window.location
window.location.href = '/flows/' + flowId;
```

#### Navigation Links
```typescript
// Good - using m.route.Link
m(m.route.Link, { href: '/flows' }, 'View Flows');

// Acceptable - when m.route.Link is not suitable
m('a', { 
    href: '/flows',
    oncreate: m.route.link 
}, 'View Flows');
```

#### Accessing Route Parameters
```typescript
// Get a specific parameter
const flowId = m.route.param('id');

// Get all parameters
const params = m.route.param();
```

#### Getting Current Route
```typescript
const currentPath = m.route.get();
```

## Best Practices

1. **Consistency**: Always use Mithril's routing utilities throughout the application
2. **Type Safety**: Leverage TypeScript types for route parameters when available
3. **Route Options**: Use the `options` parameter in `m.route.set()` for advanced navigation control (e.g., `{ replace: true }` to replace history state)
4. **Route Resolvers**: Use route resolvers for async data loading before rendering
5. **SKIP Routes**: Return `m.route.SKIP` from a route resolver to skip the current route and continue to the next matching route

## Common Patterns

### Conditional Navigation
```typescript
if (isAuthenticated) {
    m.route.set('/dashboard');
} else {
    m.route.set('/login');
}
```

### Navigation with State
```typescript
m.route.set('/flow/:id', { id: flowId }, { 
    state: { scrollY: window.scrollY } 
});
```

### Redirect on Action
```typescript
function deleteFlow(id: string) {
    api.delete(`/flows/${id}`).then(() => {
        m.route.set('/flows'); // Navigate after action
    });
}
```
