import m from "mithril";
import { _events, dispatch } from "./shared/utils";

class FlowListService {
  _flows = []
  
  get flows(){
    return this._flows;  
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
      note?: { name: string; description: string };
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

  isOwnedByCurrentUser(): boolean {
    const currentUser = globalThis.authService?.user;
    if (!currentUser) return false;
    if (!this._flow?.flow?.user_id) return false;
    return this._flow.flow.user_id === currentUser.id;
  }

  isCreatingNew(): boolean {
    return !this._flow?.flow?.id;
  }

  canEdit(): boolean {
    return this.isCreatingNew() || this.isOwnedByCurrentUser();
  }
}

globalThis.flowService = new FlowService();
globalThis.flowListService = new FlowListService();
export {
  FlowListService,
  FlowService
};

