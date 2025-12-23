import m from 'mithril'
import { _events, dispatch } from './utils'

const _tagsEvents = {
  action: {
    refreshTagsList: 'ws::action::refreshTagsList',
  },
};

class TagsListService {
  _tags = []
  _searchQuery = ''

  get tags() {
    if (!this._searchQuery) {
      return this._tags;
    }
    // Filter tags based on search query
    const query = this._searchQuery.toLowerCase();
    return this._tags.filter(tag =>
      tag.name?.toLowerCase().includes(query) ||
      tag.slug?.toLowerCase().includes(query)
    );
  }

  get searchQuery() {
    return this._searchQuery;
  }

  setSearchQuery(query: string) {
    this._searchQuery = query;
    m.redraw();
  }

  load(tags) {
    this._tags = tags;
    m.redraw();
  }
}

globalThis.tagsListService = new TagsListService();

const TagCard = {
  view(vnode) {
    const tag = vnode.attrs.tag;
    return m('.card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300 border border-base-300 h-full',
      m('.card-body',
        [
          m('.flex items-center gap-2',
            [
              tag.color && m('.badge', {
                style: `background-color: ${tag.color}; color: white;`
              }, ''),
              m('.card-title text-lg font-semibold text-primary', tag.name || 'Untitled Tag'),
            ]
          ),
          tag.slug && m('.text-sm text-base-content/70', `Slug: ${tag.slug}`),
          m('.flex-1'),
          m('.card-actions justify-end', [
            m('button.btn btn-sm btn-ghost', 'Edit'),
          ])
        ]
      )
    );
  }
}

const SearchBar = {
  view() {
    return m('.mb-6',
      m('input.input input-bordered w-full', {
        type: 'text',
        placeholder: 'Search tags by name or slug...',
        value: globalThis.tagsListService.searchQuery,
        oninput: (e) => {
          globalThis.tagsListService.setSearchQuery(e.target.value);
        }
      })
    );
  }
}

export const TagsList: m.Component = {
  oninit() {
    // Trigger refresh on mount
    dispatch(_tagsEvents.action.refreshTagsList, {});
  },
  view() {
    const tags = globalThis.tagsListService.tags;

    return m('.container mx-auto p-4', [
      m('h1.text-3xl font-bold mb-6', 'Tags'),
      m(SearchBar),

      tags.length === 0 ?
        m('.text-center text-base-content/70 py-10',
          globalThis.tagsListService.searchQuery ?
            'No tags found matching your search.' :
            'No tags yet. Create your first tag!'
        ) :
        m('ul.grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          tags.map(tag =>
            m('li.list-none', { key: tag.id },
              m(TagCard, { tag })
            )
          )
        )
    ]);
  }
}
