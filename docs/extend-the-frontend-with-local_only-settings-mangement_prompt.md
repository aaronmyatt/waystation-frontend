You are an expert software engineer tasked with analyzing and solving a development problem.

## Context

The following markdown describes a "development flow" - a structured sequence of code locations, annotations, and context that documents a specific problem, feature, or area of investigation in a codebase. Each step includes:
- File paths and line numbers pointing to relevant code
- Code snippets showing the context around key lines
- Optional notes explaining the significance of each step

## Your Task

1. **Understand the Flow**: Read through all steps carefully to understand the full context of the problem or feature being documented.

2. **Analyze the Code**: For each code reference, understand:
   - What the code does
   - How it relates to the overall flow
   - Any potential issues, patterns, or opportunities for improvement

3. **Propose a Solution**: Based on your analysis:
   - Identify the core problem or objective
   - Propose a clear, actionable solution
   - Provide specific code changes where applicable
   - Explain your reasoning and any trade-offs
   - Follow best practices for the language/framework involved

4. **Consider Edge Cases**: Think about:
   - Error handling
   - Performance implications
   - Maintainability and readability
   - Testing considerations

---

## Development Flow

# Extend the frontend with local_only settings mangement

> The vscode extension will respect a local_only setting in the flow table. This can either be written from the frontend and upserted along side other flow data, `local_only: true`, or configured for the whole repo/workspace via a workspace setting. The vscode frontend should be extended to manage these settings.

## [New settings toggle event](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/utils.ts#L85)

This event should be triggered by the vscode client frontend to toggle the workspace level local_only default setting. We should add a new "Settings" button to the Layout sidedrawer and open a similar modal to the `FlowSettingsModal` for global settings management. We need to add a `GlobalSettingsModal` modelled after the `FlowSettingsModal`



[View on GitHub](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/utils.ts#L85)
```text
   80:     uploadRequested: 'ws::file::uploadRequested',
   81:     uploadSuccess: 'ws::file::uploadSuccess',
   82:     uploadError: 'ws::file::uploadError',
   83:   },
   84:   config: {
=> 85:     toggleWorkspaceLocalOnly: 'ws::config::toggleWorkspaceLocalOnly'
   86:   }
   87: };
   88: 
   89: export const storageKeys = {
   90:   user: 'ws::user',
```


## [Disable feature flag for vscode extension](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/ws-flows-list.ts#L31)

We want the settings modal to show up on the vscode client now. This will be handled on the vscode webview side. Do nothing with this code.



[View on GitHub](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/ws-flows-list.ts#L31)
```text
   26: export const FlowCard = {
   27:   oninit(vnode){
   28:     vnode.state.settingsModalEnabled = vnode.attrs.settingsModalEnabled
   29:     
   30:     if(vnode.state.settingsModalEnabled === undefined){
=> 31:       vnode.state.settingsModalEnabled = globalThis.featureToggleService.isEnabled('settings-modal') && globalThis.flowService.canEdit(vnode.attrs.flow);
   32:     }
   33:   },
   34:   view(vnode){
   35:     return m('.card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300 border border-base-300 h-full', 
   36:       m('.card-body', [
```


## [Add new feature flag](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/ws-flow-settings-modal.ts#L35)

Now that the modal will be visible on vscode, we need to hide the "visibility" form from the vscode side, as these settings are only relevant to the web app. Add a new feature flag `flow-visibility-form`



[View on GitHub](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/ws-flow-settings-modal.ts#L35)
```text
   30:                   tabindex: -1, 
   31:                   "aria-label": "Close dialog" 
   32:                 }, '✕')
   33:               ),
   34:               m('h3.text-lg font-bold text-base-content mb-4', 'Flow Settings'),
=> 35:               m('form', {},
   36:                 m('.join.join-vertical',
   37:                   [
   38:                     // Private
   39:                     m('label.flex.items-start.justify-between.rounded-lg.p-4.join-item.cursor-pointer.transition-colors', {
   40:                       class: vnode.state.visibility === 'private' ? 'bg-primary/10' : 'hover:bg-base-200',
```


## [Feature toggle service is updated](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/services/feature-toggle.ts#L5)



[View on GitHub](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/services/feature-toggle.ts#L5)
```text
   1: export class FeatureToggleService {
   2:   private features: Record<string, boolean> = {
   3:     "settings-modal": true,
   4:     "llm-generation": true,
=> 5:     "flow-visibility-form": true,
   6:   };
   7: 
   8:   constructor() {
   9:     // initialize from window global if available
   10:     if (globalThis.__INITIAL_DATA__?.features) {
```


## [Local dev values have been updated](https://github.com/aaronmyatt/waystation-frontend/blob/main/index.html#L338)



[View on GitHub](https://github.com/aaronmyatt/waystation-frontend/blob/main/index.html#L338)
```text
   338:   features: {
   339:     "settings-modal": true,
   340:     "flow-visibility-form": false
   341:   },
   342:   config: {
   343:     workspaceLocalOnly: true
   344:   }
```


## [Extend settings modal](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/ws-flow-settings-modal.ts#L34)

The FlowSettingsModal should be extended to introduce a new toggle. When the toggle is selected, the flow for the FlowCard / FlowSettingsModal will need to be loaded into memory via: 

`dispatch(_events.action.requestFlow, { flowId: args.id });`

This is because we don't have the full flow data on the FlowList page. This is crucial because the extension will aggressively upsert and delete any absent data. Once the Flow is loaded into the FlowService, we can safely update it and emit those changes back to the extension.



[View on GitHub](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/ws-flow-settings-modal.ts#L34)
```text
   29:                 m('button.btn btn-sm btn-circle btn-ghost absolute right-2 top-2', { 
   30:                   tabindex: -1, 
   31:                   "aria-label": "Close dialog" 
   32:                 }, '✕')
   33:               ),
=> 34:               m('h3.text-lg font-bold text-base-content mb-4', 'Flow Settings'),
   35:               m('form', {},
   36:                 m('.join.join-vertical',
   37:                   [
   38:                     // Private
   39:                     m('label.flex.items-start.justify-between.rounded-lg.p-4.join-item.cursor-pointer.transition-colors', {
```


## [Mutate a copy of the flow and pass it back to the service](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/services/index.ts#L182)



[View on GitHub](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/services/index.ts#L182)
```text
   177: 
   178:   dispatchUpdated(){
   179:     dispatch(_events.flow.updated, this._flow);
   180:   }
   181: 
=> 182:   updateFlow(flow) {
   183:     this._flow.flow = flow;
   184:     this.dispatchUpdated();
   185:     console.debug("Flow updated:", this._flow);
   186:   }
   187: 
```


## [FlowSettingsModal within the editor](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/ws-flow-editor.ts#L13)

When a flow-editor is active, the FlowToolbar should provide a link to `Settings` that will reveal the FlowSettingsModal. In this case the FlowService will already be loaded with the correct state, so a simple `flow.id` check should be sufficient to avoid waiting for the state to be loaded.



[View on GitHub](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/ws-flow-editor.ts#L13)
```text
   8: import { FlowGitInfo } from "../components/flow-git-info";
   9: import { FlowParentChildModal } from "../components/flow-parent-child-modal";
   10: 
   11: let skipRederaw = false;
   12: 
=> 13: const FlowToolbar = {
   14:   view(vnode) {
   15:     return m("ul.flow-toolbar flex flex-wrap gap-2", [
   16:       // Button to open parent-child relations drawer
   17:       // Shows an icon that opens a drawer displaying parent and child flows
   18:       globalThis.authService.loggedIn && m(FlowParentChildModal, {
```


## [FlowSettingsModal has been added to the editor](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/ws-flow-editor.ts#L562)

It will be revealable via the same event used on the FlowList: 

```
onclick: (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(_sharedEvents.ui.openFlowSettingsModal, { flow: vnode.attrs.flow });
}
```



[View on GitHub](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/ws-flow-editor.ts#L562)
```text
   557:         )),
   558:         m(FlowMatchList, {
   559:           matches: vnode.state.matches,
   560:         }),
   561:         m(InsertBetweenDialog),
=> 562:         m(FlowSettingsModal),
   563:       ]);
   564:     },
   565:   };
   566: }
   567: 
```


## [Manage vscode workspace local_only toggle](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/ws-layout.ts#L197)

Finally, the layout should be extended with a `Settings` button in the side drawer, that will reveal a `GlobalSettingsModal` , modelled after the `FlowSettingsModal`. The responsibility of the GlobalSettingsModal will be to issue the new event: `    toggleWorkspaceLocalOnly: 'ws::config::toggleWorkspaceLocalOnly'` and render a Checkbox that matches the initial value found at: `globalThis.__INITIAL_DATA__.config.workspaceLocalOnly`



[View on GitHub](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/shared/ws-layout.ts#L197)
```text
   192:                 )
   193:               ),
   194:           ]),
   195:           vnode.state.loggedIn && m(".flex-1", m(TagsList)),
   196:           m(".mt-4.md:hidden.flex.justify-center", m(ThemePicker))
=> 197:         ])
   198:       ])
   199:     ]);
   200:   },
   201: };
```


## [Ensure local only preference is respected](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/vscode-extension/index.ts#L23)

if `globalThis.__INITIAL_DATA__.config.workspaceLocalOnly === true` new flows created in the workspace should always default to `local_only: true`. For redundancy, write local_only when the event is dispatched:

`dispatch(_events.flow.updated, globalThis.flowService._flow);`

and please read the users preference value once the newly created flow is recieved by `/flow/new` and write the corresponding `local_only` value to the active flow.



[View on GitHub](https://github.com/aaronmyatt/waystation-frontend/blob/main/src/vscode-extension/index.ts#L23)
```text
   18:     },
   19:     render(vnode) {
   20:       return m(Layout, m(FlowList, vnode.attrs));
   21:     },
   22:   },
=> 23:   "/flow/new": {
   24:     onmatch(): Promise<void> {
   25:       globalThis.flowService.reset();
   26:       
   27:       // Dispatch flow updated event to trigger backend save
   28:       dispatch(_events.flow.updated, globalThis.flowService._flow);
```



---

## Response Format

Please structure your response as:
1. **Summary**: Brief overview of what the flow documents
2. **Analysis**: Key observations about the code and problem
3. **Solution**: Detailed proposal with code changes
4. **Implementation Notes**: Any additional considerations for implementation