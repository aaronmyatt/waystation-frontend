# Waystation Frontend - Architecture Enhancements

This document proposes enhancements and alternatives to strengthen the client-agnostic architecture of Waystation Frontend.

## Table of Contents

1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Proposed Enhancements](#proposed-enhancements)
3. [Alternative Architectures](#alternative-architectures)
4. [Migration Strategies](#migration-strategies)
5. [Best Practices](#best-practices)

## Current Architecture Analysis

### Strengths ✅

1. **Strong Separation of Concerns**: 95%+ code sharing between platforms
2. **Event-Driven Design**: Clean decoupling through CustomEvents
3. **Lightweight Stack**: Mithril.js provides small bundle size
4. **Global Services**: Simple, effective state management
5. **Type Safety**: TypeScript across the codebase

### Areas for Improvement 🔄

1. **Service Discovery**: Global namespace pollution (`globalThis.flowService`)
2. **Event Type Safety**: CustomEvents lose TypeScript typing
3. **Service Reactivity**: Manual `m.redraw()` calls and `dispatchUpdated()`
4. **Polling Pattern**: Async operations use polling instead of promises/observables
5. **Platform Adaptation**: Limited abstraction for platform-specific features
6. **Testing**: Global services make unit testing challenging

## Proposed Enhancements

### Enhancement 1: Service Registry Pattern

**Problem**: Services attached directly to `globalThis` pollute global scope and make testing difficult.

**Solution**: Implement a service registry with dependency injection.

```typescript
// src/shared/service-registry.ts
type ServiceConstructor<T> = new (...args: any[]) => T;

class ServiceRegistry {
  private services = new Map<string, any>();
  
  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }
  
  get<T>(name: string): T {
    if (!this.services.has(name)) {
      throw new Error(`Service ${name} not registered`);
    }
    return this.services.get(name) as T;
  }
  
  clear(): void {
    this.services.clear();
  }
}

export const serviceRegistry = new ServiceRegistry();

// Usage in components
const flowService = serviceRegistry.get<FlowService>('flowService');
```

**Benefits:**
- ✅ Easier to mock services in tests
- ✅ Clear service dependencies
- ✅ No global namespace pollution
- ✅ Can swap implementations per platform

**Migration Path:**
```typescript
// Phase 1: Add registry alongside globals
globalThis.flowService = new FlowService();
serviceRegistry.register('flowService', globalThis.flowService);

// Phase 2: Update components to use registry
// const flow = globalThis.flowService.flow;  // OLD
const flowService = serviceRegistry.get<FlowService>('flowService');
const flow = flowService.flow;  // NEW

// Phase 3: Remove globals once all components migrated
```

### Enhancement 2: Typed Event Bus

**Problem**: CustomEvents lose TypeScript type information, making it easy to pass wrong data.

**Solution**: Implement a typed event bus.

```typescript
// src/shared/event-bus.ts
type EventMap = {
  'ws::action::requestFlow': { flowId: string };
  'ws::action::refreshList': {};
  'ws::flow::updated': { flow: FlowData };
  'ws::action::export': { flow: FlowMetadata };
  'ws::action::deleteFlow': { flow: FlowMetadata };
  'ws::action::clickFlowMatch': { flowMatch: FlowMatch };
  // ... all other events
};

type EventCallback<K extends keyof EventMap> = (data: EventMap[K]) => void;

class TypedEventBus {
  private listeners = new Map<keyof EventMap, Set<EventCallback<any>>>();
  
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    // Still use CustomEvent for platform compatibility
    globalThis.dispatchEvent(
      new CustomEvent(event, { detail: data })
    );
    
    // Also call direct listeners
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
  
  on<K extends keyof EventMap>(
    event: K, 
    callback: EventCallback<K>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }
}

export const eventBus = new TypedEventBus();

// Usage - now with type safety!
eventBus.emit('ws::action::requestFlow', { flowId: '123' }); // ✅ Type-safe
eventBus.emit('ws::action::requestFlow', { id: '123' });     // ❌ TypeScript error!

// Subscribe with type-safe callbacks
const unsubscribe = eventBus.on('ws::flow::updated', (data) => {
  console.log(data.flow.name); // ✅ 'flow' is typed
});
```

**Benefits:**
- ✅ Full TypeScript type checking for events
- ✅ Autocomplete for event names and data structures
- ✅ Catch errors at compile time
- ✅ Better developer experience
- ✅ Still compatible with CustomEvents for host integration

### Enhancement 3: Observable Services (Reactive State)

**Problem**: Manual `m.redraw()` and `dispatchUpdated()` calls are error-prone.

**Solution**: Make services observable/reactive.

```typescript
// src/shared/observable.ts
type Subscriber<T> = (value: T) => void;

class Observable<T> {
  private value: T;
  private subscribers = new Set<Subscriber<T>>();
  
  constructor(initialValue: T) {
    this.value = initialValue;
  }
  
  get(): T {
    return this.value;
  }
  
  set(newValue: T): void {
    if (this.value !== newValue) {
      this.value = newValue;
      this.notify();
    }
  }
  
  subscribe(callback: Subscriber<T>): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  private notify(): void {
    this.subscribers.forEach(cb => cb(this.value));
  }
}

// Enhanced FlowService with observables
class FlowServiceV2 {
  private flowState = new Observable<FlowData>({
    flow: { name: '', description: '' },
    matches: []
  });
  
  get flow() {
    return this.flowState.get().flow;
  }
  
  get matches() {
    return this.flowState.get().matches;
  }
  
  subscribe(callback: (flow: FlowData) => void) {
    return this.flowState.subscribe(callback);
  }
  
  updateFlow(flow: FlowMetadata) {
    const current = this.flowState.get();
    this.flowState.set({
      ...current,
      flow: { ...current.flow, ...flow }
    });
    // Auto-emits event and triggers redraws!
  }
}

// Usage in Mithril components
const Flow: m.Component = {
  oninit(vnode) {
    // Subscribe to changes
    vnode.state.unsubscribe = flowService.subscribe((flow) => {
      m.redraw(); // Auto-redraw on changes
    });
  },
  
  onremove(vnode) {
    vnode.state.unsubscribe(); // Cleanup
  },
  
  view(vnode) {
    return m('div', flowService.flow.name);
  }
};
```

**Benefits:**
- ✅ Automatic reactivity - no manual `m.redraw()` calls
- ✅ No forgetting to dispatch update events
- ✅ Subscription-based updates
- ✅ Clean component lifecycle management

### Enhancement 4: Platform Adapter Pattern

**Problem**: Host integration logic is scattered and polling-based.

**Solution**: Create a platform adapter interface.

```typescript
// src/shared/platform-adapter.ts
export interface PlatformAdapter {
  // Flow operations
  requestFlow(flowId: string): Promise<FlowData>;
  saveFlow(flow: FlowData): Promise<void>;
  deleteFlow(flowId: string): Promise<void>;
  
  // Flow list operations
  listFlows(): Promise<FlowMetadata[]>;
  
  // AI operations
  generateFlowContent(flow: FlowMetadata): Promise<string>;
  generateFlowMatchContent(match: FlowMatch): Promise<string>;
  
  // File operations
  exportFlow(flow: FlowData): Promise<void>;
  
  // Navigation
  openFile(fileName: string, line?: number): Promise<void>;
}

// VSCode implementation (in src/vscode-extension/)
class VSCodeAdapter implements PlatformAdapter {
  async requestFlow(flowId: string): Promise<FlowData> {
    return new Promise((resolve, reject) => {
      // Send message to VSCode host
      vscode.postMessage({ type: 'requestFlow', flowId });
      
      // Listen for response
      const handler = (event: MessageEvent) => {
        if (event.data.command === 'flowLoaded') {
          window.removeEventListener('message', handler);
          resolve(event.data.flow);
        }
      };
      window.addEventListener('message', handler);
      
      setTimeout(() => reject('Timeout'), 5000);
    });
  }
  
  async saveFlow(flow: FlowData): Promise<void> {
    vscode.postMessage({ type: 'saveFlow', flow });
  }
  
  // ... other methods
}

// Web implementation (in src/web/)
class WebAdapter implements PlatformAdapter {
  async requestFlow(flowId: string): Promise<FlowData> {
    const response = await fetch(`/api/flows/${flowId}`);
    if (!response.ok) throw new Error('Failed to load flow');
    return response.json();
  }
  
  async saveFlow(flow: FlowData): Promise<void> {
    await fetch(`/api/flows/${flow.flow.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flow)
    });
  }
  
  // ... other methods
}

// Register adapter at app initialization
serviceRegistry.register('platformAdapter', new VSCodeAdapter());
// or
serviceRegistry.register('platformAdapter', new WebAdapter());

// Usage in components/services - now promise-based!
const adapter = serviceRegistry.get<PlatformAdapter>('platformAdapter');
const flow = await adapter.requestFlow('123'); // ✅ No polling!
```

**Benefits:**
- ✅ Promise-based async operations (no polling!)
- ✅ Clear platform abstraction
- ✅ Testable with mock adapters
- ✅ Type-safe platform operations
- ✅ Easy to add new platforms

### Enhancement 5: Command Pattern for Actions

**Problem**: Action handlers scattered across components and event listeners.

**Solution**: Centralize actions in command handlers.

```typescript
// src/shared/commands.ts
export interface Command<TInput = void, TOutput = void> {
  execute(input: TInput): Promise<TOutput>;
}

// Example command
class RequestFlowCommand implements Command<{ flowId: string }, FlowData> {
  constructor(
    private adapter: PlatformAdapter,
    private flowService: FlowService
  ) {}
  
  async execute({ flowId }: { flowId: string }): Promise<FlowData> {
    const flow = await this.adapter.requestFlow(flowId);
    this.flowService.load(flow);
    return flow;
  }
}

class DeleteFlowCommand implements Command<{ flowId: string }, void> {
  constructor(
    private adapter: PlatformAdapter,
    private router: Router
  ) {}
  
  async execute({ flowId }: { flowId: string }): Promise<void> {
    await this.adapter.deleteFlow(flowId);
    this.router.navigate('/');
  }
}

// Command registry
class CommandRegistry {
  private commands = new Map<string, Command<any, any>>();
  
  register<TInput, TOutput>(
    name: string, 
    command: Command<TInput, TOutput>
  ): void {
    this.commands.set(name, command);
  }
  
  async execute<TInput, TOutput>(
    name: string, 
    input: TInput
  ): Promise<TOutput> {
    const command = this.commands.get(name);
    if (!command) {
      throw new Error(`Command ${name} not registered`);
    }
    return command.execute(input);
  }
}

// Initialize commands
const commands = new CommandRegistry();
commands.register('requestFlow', new RequestFlowCommand(adapter, flowService));
commands.register('deleteFlow', new DeleteFlowCommand(adapter, router));

// Usage in components - clean and testable
await commands.execute('requestFlow', { flowId: '123' });
```

**Benefits:**
- ✅ Centralized action logic
- ✅ Easy to test commands in isolation
- ✅ Clear separation of concerns
- ✅ Reusable across platforms
- ✅ Easy to add middleware (logging, validation, etc.)

### Enhancement 6: Storage Abstraction

**Problem**: No clear abstraction for client-side storage (localStorage, IndexedDB, etc.)

**Solution**: Storage adapter interface.

```typescript
// src/shared/storage-adapter.ts
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

class LocalStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }
  
  async delete(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
  
  async clear(): Promise<void> {
    localStorage.clear();
  }
}

class IndexedDBAdapter implements StorageAdapter {
  // Implementation using IndexedDB for larger datasets
  async get<T>(key: string): Promise<T | null> {
    // IndexedDB get logic
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    // IndexedDB set logic
  }
  
  // ... other methods
}

// Usage
const storage = serviceRegistry.get<StorageAdapter>('storage');
await storage.set('theme', 'dark');
const theme = await storage.get<string>('theme');
```

**Benefits:**
- ✅ Platform-agnostic storage
- ✅ Can use different storage backends per platform
- ✅ Async API works with all storage types
- ✅ Testable with mock storage

## Alternative Architectures

### Alternative 1: Web Components Architecture

**Concept**: Use Web Components instead of Mithril for truly universal components.

```
┌─────────────────────────────────────────────────────────┐
│                  Web Components Layer                    │
│                                                          │
│  <waystation-flow-list>                                 │
│  <waystation-flow>                                      │
│  <waystation-flow-match>                                │
│                                                          │
│  • Framework-agnostic                                   │
│  • Native browser APIs                                  │
│  • Shadow DOM for encapsulation                         │
│  • Custom elements with slots                           │
└─────────────────────────────────────────────────────────┘
              │                         │
              │                         │
    ┌─────────▼──────────┐   ┌─────────▼──────────┐
    │   VSCode WebView   │   │   React/Vue/etc    │
    │   (any framework)  │   │   (any framework)  │
    └────────────────────┘   └────────────────────┘
```

**Pros:**
- ✅ True framework independence
- ✅ Can integrate with any framework
- ✅ Native browser support
- ✅ Strong encapsulation

**Cons:**
- ❌ Larger bundle size
- ❌ More complex state management
- ❌ Limited browser support (need polyfills)
- ❌ Breaking change (full rewrite)

### Alternative 2: Message Passing Architecture

**Concept**: Use a standardized message protocol like JSON-RPC for all communication.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Application                  │
│                                                          │
│  JSON-RPC Client                                        │
│  ├─ call('flow.get', { id: '123' })                    │
│  ├─ call('flow.update', { id: '123', data: {...} })    │
│  ├─ call('flow.delete', { id: '123' })                 │
│  └─ call('flow.list', {})                              │
│                                                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ JSON-RPC 2.0 Messages
                     │ { jsonrpc: "2.0", method: "...", params: {...} }
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Platform Backend                      │
│                                                          │
│  JSON-RPC Server                                        │
│  ├─ handle('flow.get', async (params) => {...})        │
│  ├─ handle('flow.update', async (params) => {...})     │
│  ├─ handle('flow.delete', async (params) => {...})     │
│  └─ handle('flow.list', async (params) => {...})       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Standardized protocol
- ✅ Language-agnostic
- ✅ Easy to version and evolve API
- ✅ Clear request/response pattern

**Cons:**
- ❌ More overhead than direct CustomEvents
- ❌ Need to implement JSON-RPC client/server
- ❌ Less direct than current approach

### Alternative 3: Micro-Frontend Architecture

**Concept**: Split into multiple independent micro-frontends.

```
┌─────────────────────────────────────────────────────────┐
│                    Shell Application                     │
│                    (Routing & Layout)                    │
└───────┬──────────────────────────┬──────────────────────┘
        │                          │
┌───────▼──────────┐      ┌────────▼─────────┐
│  Flow List MFE   │      │  Flow Editor MFE │
│  • Independent   │      │  • Independent   │
│  • Own state     │      │  • Own state     │
│  • Own deps      │      │  • Own deps      │
└──────────────────┘      └──────────────────┘
```

**Pros:**
- ✅ Truly independent modules
- ✅ Can use different versions of dependencies
- ✅ Teams can work independently
- ✅ Easier to maintain at scale

**Cons:**
- ❌ More complex setup
- ❌ Larger total bundle size
- ❌ Inter-MFE communication overhead
- ❌ Overkill for current size

### Alternative 4: CQRS + Event Sourcing

**Concept**: Separate read and write models, store all changes as events.

```
┌─────────────────────────────────────────────────────────┐
│                      UI Components                       │
└───────┬──────────────────────────┬──────────────────────┘
        │                          │
        │ Commands                 │ Queries
        │                          │
┌───────▼──────────┐      ┌────────▼─────────┐
│ Command Handlers │      │  Query Handlers  │
│ • CreateFlow     │      │  • GetFlow       │
│ • UpdateFlow     │      │  • ListFlows     │
│ • DeleteFlow     │      │  • SearchFlows   │
└───────┬──────────┘      └────────▲─────────┘
        │                          │
        │ Events                   │ Read Model
        │                          │
┌───────▼──────────────────────────┴─────────┐
│              Event Store                   │
│  • FlowCreated                             │
│  • FlowUpdated                             │
│  • FlowMatchAdded                          │
│  • FlowMatchDeleted                        │
└────────────────────────────────────────────┘
```

**Pros:**
- ✅ Full audit trail
- ✅ Time-travel debugging
- ✅ Optimized read/write models
- ✅ Event replay for testing

**Cons:**
- ❌ Much more complex
- ❌ Overkill for current requirements
- ❌ Requires event store infrastructure
- ❌ Eventual consistency challenges

## Migration Strategies

### Strategy 1: Gradual Enhancement (Recommended)

Implement enhancements incrementally without breaking changes:

**Phase 1: Add Service Registry** (Week 1)
```typescript
// Add registry alongside existing globals
serviceRegistry.register('flowService', globalThis.flowService);
// Old code continues to work
```

**Phase 2: Add Typed Event Bus** (Week 2)
```typescript
// Emit through both old and new APIs
eventBus.emit('ws::action::requestFlow', { flowId });
dispatch('ws::action::requestFlow', { flowId }); // Still works
```

**Phase 3: Add Platform Adapter** (Week 3-4)
```typescript
// Implement adapter for current platform
// Gradually migrate event handlers to use adapter
```

**Phase 4: Add Observable Services** (Week 5-6)
```typescript
// Create V2 services with observables
// Migrate components one at a time
```

**Phase 5: Remove Legacy Code** (Week 7+)
```typescript
// Once all components migrated, remove old patterns
```

### Strategy 2: New Feature Flag

Add new patterns behind feature flags:

```typescript
const FEATURES = {
  useServiceRegistry: false,
  useTypedEvents: false,
  usePlatformAdapter: false,
  useObservables: false
};

// Enable features gradually
if (FEATURES.useServiceRegistry) {
  const flowService = serviceRegistry.get('flowService');
} else {
  const flowService = globalThis.flowService;
}
```

### Strategy 3: Parallel Implementation

Create new architecture in parallel, migrate routes one at a time:

```typescript
// Old route
'/flow/:id': {
  render: () => m(Flow) // Old component
}

// New route (parallel)
'/flow-v2/:id': {
  render: () => m(FlowV2) // New architecture
}

// Gradually migrate users, then swap
```

## Best Practices

### 1. Interface Segregation

Keep platform adapters focused:

```typescript
// ✅ Good - focused interfaces
interface FlowPersistence {
  saveFlow(flow: FlowData): Promise<void>;
  loadFlow(id: string): Promise<FlowData>;
}

interface AIGeneration {
  generateFlowContent(flow: FlowMetadata): Promise<string>;
}

// ❌ Bad - god interface
interface PlatformAdapter {
  saveFlow(...): Promise<void>;
  loadFlow(...): Promise<FlowData>;
  generateContent(...): Promise<string>;
  exportFile(...): Promise<void>;
  openFile(...): Promise<void>;
  // ... 20 more methods
}
```

### 2. Error Boundaries

Add error handling at architecture boundaries:

```typescript
class ErrorBoundaryService {
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Log error
      console.error('Operation failed:', error);
      
      // Emit error event for host
      eventBus.emit('ws::action::actionError', {
        message: error.message,
        stack: error.stack
      });
      
      // Re-throw or return fallback
      throw error;
    }
  }
}

// Usage
const result = await errorBoundary.execute(() => 
  adapter.requestFlow('123')
);
```

### 3. Versioning Strategy

Version your event contracts:

```typescript
type EventMap = {
  'ws::action::requestFlow@v1': { flowId: string };
  'ws::action::requestFlow@v2': { flowId: string; includeMetadata: boolean };
};

// Host can support multiple versions
eventBus.on('ws::action::requestFlow@v1', handleV1);
eventBus.on('ws::action::requestFlow@v2', handleV2);
```

### 4. Testing Strategy

Make everything testable:

```typescript
// Mock services for testing
const mockFlowService = {
  flow: { name: 'Test Flow', description: 'Test' },
  matches: [],
  updateFlow: jest.fn(),
  load: jest.fn()
};

serviceRegistry.register('flowService', mockFlowService);

// Test component
const component = m(Flow);
// Assert behaviors
expect(mockFlowService.updateFlow).toHaveBeenCalled();
```

### 5. Documentation

Document all platform contracts:

```typescript
/**
 * Platform Adapter Interface
 * 
 * This interface must be implemented by each platform (VSCode, Web, etc.)
 * to provide platform-specific functionality.
 * 
 * @example
 * ```typescript
 * class MyPlatformAdapter implements PlatformAdapter {
 *   async requestFlow(flowId: string): Promise<FlowData> {
 *     // Platform-specific implementation
 *   }
 * }
 * ```
 */
export interface PlatformAdapter {
  /**
   * Loads a flow by ID
   * @param flowId - The unique identifier of the flow
   * @returns Promise resolving to the flow data
   * @throws {FlowNotFoundError} If flow doesn't exist
   */
  requestFlow(flowId: string): Promise<FlowData>;
  
  // ... more methods with clear contracts
}
```

## Recommended Implementation Order

1. **Start with Enhancement 4 (Platform Adapter)** - Biggest immediate impact
   - Eliminates polling
   - Cleaner async handling
   - Clear platform boundaries

2. **Add Enhancement 2 (Typed Event Bus)** - Better DX
   - Type safety for events
   - Reduces bugs
   - Better IDE support

3. **Implement Enhancement 1 (Service Registry)** - Better testing
   - Easier to mock
   - Cleaner dependencies
   - Improved testability

4. **Consider Enhancement 3 (Observable Services)** - Better reactivity
   - Auto-updates
   - Less manual redraw calls
   - More reactive feel

5. **Add Enhancement 5 (Commands)** if complexity grows
   - Centralized logic
   - Easier to maintain
   - Better separation

6. **Add Enhancement 6 (Storage)** as needed
   - Offline support
   - Cache management
   - Settings persistence

## Conclusion

The current architecture is solid and achieves good client-agnosticism. The proposed enhancements address specific pain points while maintaining the core design principles:

- **Event-driven communication** remains central
- **Service-based state** continues to work well  
- **Shared components** stay platform-independent
- **TypeScript** provides safety throughout

The incremental migration strategy allows adopting improvements without disruption, while the alternative architectures provide options for future evolution if requirements change significantly.
