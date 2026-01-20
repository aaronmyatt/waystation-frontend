import m from "mithril";
import { api } from "../shared/api-client";

/**
 * FlowRelationService manages the state and API calls for flow parent-child relationships.
 * It fetches and stores information about a flow's parent (if copied from another flow)
 * and children (flows that were created as copies/branches from this flow).
 */
export class FlowRelationService {
  private _state = {
    loading: false,
    error: null as string | null,
    parent: null as any,
    children: [] as any[],
  };

  /**
   * Getter for loading state
   */
  get loading() {
    return this._state.loading;
  }

  /**
   * Getter for error state
   */
  get error() {
    return this._state.error;
  }

  /**
   * Getter for parent flow
   */
  get parent() {
    return this._state.parent;
  }

  /**
   * Getter for child flows
   */
  get children() {
    return this._state.children;
  }

  /**
   * Check if there are any relations (parent or children)
   */
  hasRelations(): boolean {
    return !!this._state.parent || this._state.children.length > 0;
  }

  /**
   * Fetch flow relations from the API
   * @param flowId - The ID of the flow to fetch relations for
   */
  async fetchRelations(flowId: string): Promise<void> {
    this._state.loading = true;
    this._state.error = null;
    m.redraw();

    try {
      const response = await api.flowRelations.get(flowId);
      
      // API returns { parent: FlowObject | null, children: FlowObject[] }
      this._state.parent = response.data.parent || null;
      this._state.children = response.data.children || [];
      
      console.debug("Flow relations loaded:", {
        parent: this._state.parent,
        children: this._state.children,
      });
    } catch (error: any) {
      console.error("Failed to load flow relations:", error);
      this._state.error = error.response?.data?.message || "Failed to load flow relations";
      // Set empty state on error
      this._state.parent = null;
      this._state.children = [];
    } finally {
      this._state.loading = false;
      m.redraw();
    }
  }

  /**
   * Reset the service state
   */
  reset(): void {
    this._state = {
      loading: false,
      error: null,
      parent: null,
      children: [],
    };
    m.redraw();
  }

  /**
   * Get both parent and children as a tuple
   * Useful for destructuring in components
   */
  getRelations(): [any, any[]] {
    return [this._state.parent, this._state.children];
  }
}
