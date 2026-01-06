import m from 'mithril'
import { _events, dispatch } from '../shared/utils'

const TagCard = {
  view(vnode) {
    return m('.card card-xs sm:card-md bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300 border border-base-300 h-full',
      m('.card-body',
        [
          m('.flex items-center gap-1 sm:gap-2',
            [
              vnode.attrs.color && m('.badge', {
                style: `background-color: ${vnode.attrs.color}; color: white;`
              }, ''),
              m('.card-title text-md sm:text-lg font-semibold text-primary', vnode.attrs.name || 'Untitled Tag'),
            ]
          ),
          vnode.attrs.slug && m('.text-xs sm:text-sm text-base-content/70', `Slug: ${vnode.attrs.slug}`)
        ]
      )
    );
  }
}

const SearchBar = {
  view() {
    return m('.mb-2 sm:mb-6',
      m('input.input input-bordered w-full', {
        type: 'text',
        placeholder: 'Search tags by name or slug...',
        value: globalThis.tagsListService.searchQuery,
        oninput: (e) => {
          globalThis.tagsListService.search(e.target.value, { per_page: 100, page: 1 });
        }
      })
    );
  }
}

export const TagsList: m.Component = {
  oninit() {
    // Trigger refresh on mount
    dispatch(_events.action.refreshTagsList, {
      params: {
        per_page: 100, page: 1, 
      }
    });
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
        m('ul.grid gap-1 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          tags.map((tag) =>
            m('li.list-none', { key: tag.id },
              m(m.route.Link, { href: `/?tags=${tag.slug}` },
                m(TagCard, {
                  name: tag.name,
                  slug: tag.slug,
                  color: tag.color,
                })
              )
            )
          )
        )
    ]);
  }
}
