import m from "mithril";
import { api } from "../shared/api-client";
import { debounce } from "../shared/utils";

export class TagsListService {
  _tags = []
  _searchQuery = ''
  _pagination = {
    per_page: 100,
    page: 1,
  };
  private _debouncedRefresh: Function;
  private _debouncedToggleFavourite: Function;

  constructor(){
    if (globalThis.__INITIAL_DATA__?.tags) {
      try {
        this._tags = globalThis.__INITIAL_DATA__.tags.rows || [];
        this._pagination = {
          per_page: globalThis.__INITIAL_DATA__.tags.per_page || 100,
          page: globalThis.__INITIAL_DATA__.tags.page || 1,
        };
      } catch (err) {
        console.error("Failed to load initial tag data:", err);
      }
    }

    // Create debounced versions of API methods
    this._debouncedRefresh = debounce(this._refresh.bind(this), 500);
    this._debouncedToggleFavourite = debounce(this._toggleFavourite.bind(this), 300);
  }

  get tags() {
    if (!this._searchQuery) {
      return this._tags;
    }
    // Filter tags based on search query
    const query = this._searchQuery.toLowerCase();
    return this._tags.filter(tag =>
      tag.name?.toLowerCase().startsWith(query) ||
      tag.slug?.toLowerCase().startsWith(query)
    );
  }

  push(tag) {
    if(this._tags.find(t => t.id === tag.id)){
      return;
    }
    this._tags.push(tag);
    m.redraw();
  }

  delete(tagId) {
    this._tags = this._tags.filter(tag => tag.id !== tagId);
    m.redraw();
  }

  get searchQuery() {
    return this._searchQuery;
  }

  search(query: string, pagination: { per_page: number; page: number }) {
    this._searchQuery = query;
    // Call refresh to fetch tags from backend
    // Note: Filtering is done client-side in the `tags` getter
    this.refresh();
  }

  load(tags) {
    this._tags = tags.rows;
    this._pagination = {
      per_page: tags.per_page,
      page: tags.page,
    };
    m.redraw();
  }

  // Public API methods with debouncing
  refresh() {
    this._debouncedRefresh();
  }

  toggleFavourite(tag: { id: string, is_favourite: boolean }) {
    this._debouncedToggleFavourite(tag);
  }

  // Private implementation methods
  private async _refresh() {
    try {
      const response = await api.userTags.list();
      const tags = response.data;
      this.load(tags);
      console.log(`Loaded ${tags.rows.length} tags`, tags);
    } catch (error: any) {
      console.error("Error fetching tags:", error);
      console.error("Error response:", error.response);
      if (error.response?.status === 401) {
        console.error("Authentication failed - please log in again");
      }
    }
  }

  private async _toggleFavourite(tag: { id: string, is_favourite: boolean }) {
    try {
      console.log("Toggle favourite tag event received:", { tag });
      if(tag.is_favourite) {
        await api.favouriteTags.delete(tag.id);
      } else {
        await api.favouriteTags.create(tag.id);
      }

      // Refresh the tags list after toggling (using debounced method)
      this.refresh();
    } catch (error) {
      console.error("Error toggling tag favourite:", error);
    }
  }
}