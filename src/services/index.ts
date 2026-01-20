import m from "mithril";
import { CopyFlowService } from "./copy-flow";
import { TagsListService } from "./tags-list";
import { FlowRelationService } from "./flow-relation";
import { _events, dispatch, storageKeys } from "../shared/utils";

class AuthService {
  _state = {
    loading: false,
    error: '',
    success: '',
  }

  get loading() {
    return this._state.loading;
  }

  get error() {
    return this._state.error;
  }

  get success() {
    return this._state.success;
  }

  setLoading(loading: boolean) {
    this._state.loading = loading;
    m.redraw();
  }

  setError(error: string) {
    this._state.error = error;
    this._state.success = '';
    m.redraw();
  }

  setSuccess(success: string) {
    this._state.success = success;
    this._state.error = '';

    m.route.set('/'); // Redirect to home on success
    // m.redraw();
  }

  clearMessages() {
    this._state.error = '';
    this._state.success = '';
    m.redraw();
  }

  reset() {
    this._state = {
      loading: false,
      error: '',
      success: '',
    };
    m.redraw();
  }

  get user() {
    const userJson = localStorage.getItem(storageKeys.user);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (err) {
        console.error("Failed to parse user data from localStorage:", err);
        return null;
      }
    }
    return null;
  }

  get loggedIn() {
    const token = localStorage.getItem(storageKeys.authToken);
    return !!token;
  }

  get loggedOut() {
    return !this.loggedIn;
  }

  logout(){
    localStorage.removeItem(storageKeys.authToken);
    this.reset();
    m.route.set('/');
  }
}

class FeatureToggleService {
  private features: Record<string, boolean> = {
    "settings-modal": true,
    "llm-generation": true,
  };

  constructor() {
    // initialize from window global if available
    if (globalThis.__INITIAL_DATA__?.features) {
      this.features = {
        ...this.features,
        ...globalThis.__INITIAL_DATA__.features,
      };
    }
  }


  isEnabled(featureName: string): boolean {
    return !!this.features[featureName];
  }

  setFeature(featureName: string, isEnabled: boolean) {
    this.features[featureName] = isEnabled;
  }
}

class FlowListService {
  _flows = []

  constructor(){
    if (globalThis.__INITIAL_DATA__?.flows) {
      try {
        this._flows = globalThis.__INITIAL_DATA__.flows || [];
      } catch (err) {
        console.error("Failed to load initial flow list data:", err);
      }
    }
  }
  
  get flows(){
    return this._flows;  
  }

  groupByDate(){
    return Object.entries(Object.groupBy(this._flows, (flow) => {
      const date = new Date(flow.updated_at);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    })).toSorted((a, b) => {
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateB.getTime() - dateA.getTime();
    });
  }

  push(flow){
    if(this._flows.find(f => f.id === flow.id)){
      return;
    }
    this._flows.push(flow);
    m.redraw();
  }
  
  load(flows){
   this._flows = flows;
   m.redraw()
  }
}

class FlowService {
  markdown: string = "";
  _flow: {
    flow: { name: string; description: string };
    matches: {
      flow_match_id: string;
      content_kind: string;
      step_content?: { title: string; body: string };
      match?: {
        file_name: string;
        grep_meta: string;
      };
      order_index?: number;
    }[];
  } = {
    flow: {
      name: "",
      description: "",
    },
    matches: [],
  };

  constructor(){
    if (globalThis.__INITIAL_DATA__?.flow) {
      try {
        const flow = globalThis.__INITIAL_DATA__.flow;
        if (flow.hasOwnProperty("flow") && flow.hasOwnProperty("matches")) {
          this._flow = flow;
        }
      } catch (err) {
        console.error("Failed to load initial flow data:", err);
      }
    }
  }

  get flow() {
    return this._flow?.flow || {};
  }

  get matches() {
    return this._flow?.matches || [];
  }

  dispatchUpdated(){
    dispatch(_events.flow.updated, this._flow);
  }

  updateFlow(flow) {
    this._flow.flow = flow;
    this.dispatchUpdated();
    console.debug("Flow updated:", this._flow);
  }

  updateFlowMatch(match) {
    const index = this.matches.findIndex((m) => m.flow_match_id === match.flow_match_id);
    if (index !== -1) {
      this._flow.matches[index] = match;
      this.dispatchUpdated();
      console.debug("Flow match updated:", match);
    }
  }

  deleteFlowMatch(match) {
    const index = this.matches.findIndex((m) => m.flow_match_id === match.flow_match_id);
    if (index !== -1) {
      this._flow.matches.splice(index, 1);
      // Update order indexes for remaining matches
      for (let i = index; i < this._flow.matches.length; i++) {
        const currentMatch = this._flow.matches[i];
        if (currentMatch.order_index !== undefined) {
          currentMatch.order_index = i;
        }
      }
      this.dispatchUpdated();
      console.debug("Flow match deleted:", match);
    }
  }

  moveFlowMatchUp(match) {
    const index = this.matches.findIndex((m) => m.flow_match_id === match.flow_match_id);
    if (index > 0) {
      [this._flow.matches[index - 1], this._flow.matches[index]] = [this._flow.matches[index], this._flow.matches[index - 1]];
      // Update order indexes
      this._flow.matches[index - 1].order_index = index - 1;
      this._flow.matches[index].order_index = index;
      this.dispatchUpdated();
      console.debug("Flow match moved up:", match);
    }
  }

  moveFlowMatchDown(match) {
    const index = this.matches.findIndex((m) => m.flow_match_id === match.flow_match_id);
    if (index !== -1 && index < this._flow.matches.length - 1) {
      [this._flow.matches[index + 1], this._flow.matches[index]] = [this._flow.matches[index], this._flow.matches[index + 1]];
      // Update order indexes
      this._flow.matches[index + 1].order_index = index + 1;
      this._flow.matches[index].order_index = index;
      this.dispatchUpdated();
      console.debug("Flow match moved down:", match);
    }
  }

  addNoteStep(index: number) {
    const match = {
      flow_match_id: crypto.randomUUID(),
      content_kind: 'note',
      step_content: { title: 'New Note', body: '' },
      match_id: undefined,
      order_index: index + 1,
    };
    const insertIndex = index + 1;
    this._flow.matches.splice(insertIndex, 0, match);

    // Update order indexes for all matches after the insertion point
    for (let i = insertIndex + 1; i < this._flow.matches.length; i++) {
      const currentMatch = this._flow.matches[i];
      if (currentMatch.order_index !== undefined) {
        currentMatch.order_index = i;
      }
    }
    
    this.dispatchUpdated();
    console.debug("Flow match added at index:", insertIndex, match);
  }

  load(flow) {
    if (flow.hasOwnProperty("flow") && flow.hasOwnProperty("matches")) {
      this._flow = flow;
    } else {
      throw `Incorrect object properties: ${Object.keys(flow)}`;
    }
    m.redraw();
  }

  loadPreview(flowPreview: any) {
    this._flow = { flow: flowPreview, matches: [] };
    this.markdown = flowPreview.markdown || "";
    m.redraw();
  }

  reset() {
    this._flow = {
      flow: {
        name: "New Flow",
        description: "Describe your flow here.",
      },
      matches: [
        {
          flow_match_id: crypto.randomUUID(),
          content_kind: "note",
          step_content: {
            title: "New Note",
            body: `Click edit to describe this step. 
Right click a line in your editor and choose '**Add Line**' to add a code match to this flow.`,
          },
        },
      ],
    };
  }

  clear() {
    this._flow = {
      flow: {
        name: "",
        description: "",
      },
      matches: [],
    };
  }

  redraw() {
    m.redraw();
  }

  isOwnedByCurrentUser(flow?: any): boolean {
    flow = flow || this._flow.flow;
    const currentUser = globalThis.authService?.user;
    if (!currentUser) return false;
    if (!flow?.user_id) return false;
    return flow.user_id === currentUser.id;
  }

  isCreatingNew(): boolean {
    return !this._flow?.flow?.id;
  }

  canEdit(flow?: any): boolean {
    return this.isOwnedByCurrentUser(flow);
  }
}

globalThis.flowService = new FlowService();
globalThis.flowListService = new FlowListService();
globalThis.featureToggleService = new FeatureToggleService();
globalThis.authService = new AuthService();
globalThis.tagsListService = new TagsListService();
// FlowRelationService is intentionally NOT global - it should be instantiated per component
// to manage independent state for different flow contexts

export {
  AuthService,
  FlowListService,
  FlowService,
  FeatureToggleService,
  CopyFlowService,
  TagsListService,
  FlowRelationService,
};

