import m from 'mithril'
import { _events, dispatch } from '../shared/utils'
import { TagBadge } from '../shared/ws-flow-tag-input'
import { star, starSolid } from '../shared/ws-svg'

const TagCard = {
  view(vnode) {
    return m('.card card-xs @sm:card-md @md:card-lg bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300 border border-base-300 h-full',
      [m('.card-body flex-row justify-between items-center w-full',
        [
          m('.flex flex-col gap-3', [
            m('.flex items-center gap-1 @sm:gap-2',
              [
                vnode.attrs._tag.color && m('.badge', {
                  style: `background-color: ${vnode.attrs._tag.color}; color: white;`
                }, ''),
                m('.card-title text-md @sm:text-lg font-semibold text-primary', vnode.attrs._tag.name || 'Untitled Tag'),
                
              ]
            ),
            vnode.attrs._tag.slug && m('.text-xs @sm:text-sm text-base-content/70', `Slug: ${vnode.attrs._tag.slug}`),
          ]),
          m('button.btn btn-ghost btn-square',
            { 
              onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(_events.tags.toggleFavourite, { tag: { ...vnode.attrs._tag } });
                vnode.attrs._tag.is_favourite = !vnode.attrs._tag.is_favourite;
              }
            },
            m('span.text-sm text-base-content/70 hover:text-accent hover:scale-125 transition-transform duration-200', 
              vnode.attrs._tag.is_favourite ? m('span.text-accent', m.trust(starSolid)) : m.trust(star)
            )
          )
        ],
      ),
      ]
    );
  }
}

const SearchBar = {
  view() {
    return m('.mb-2 @sm:mb-6',
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
    globalThis.tagsListService.search('', { per_page: 100, page: 1 });
  },
  view() {
    const tags = globalThis.tagsListService.tags;
    const tagsParam = m.route.param('tags') || '';
    const selectedTagSlugs = tagsParam ? tagsParam.split(',').map(s => s.trim().toLowerCase()) : [];
    
    // Find the actual tag objects for selected slugs
    const selectedTags = selectedTagSlugs
      .map(slug => tags.find(t => t.slug?.toLowerCase() === slug))
      .filter(Boolean);
    
    // Filter out selected tags from the main list
    const filteredTags = tags.filter(tag => 
      !selectedTagSlugs.includes(tag.slug?.toLowerCase())
    );
    
    return m('.@container mx-auto w-full', [
      m('h2.mb-3 sm:mb-6', [m('span.text-3xl font-bold', 'Tags'), m('span.text.xs', ' (Click to filter)')]),
      m(SearchBar),
      
      // Show selected tags as badges
      selectedTags.length > 0 && m('.flex.flex-wrap.items-center.gap-2.mb-4', 
        selectedTags.map((tag) =>
          m(TagBadge, {
            key: tag.id,
            _tag: tag,
            ondelete: (e) => {
              e.preventDefault();
              e.stopPropagation();
              // Remove this tag from the query params
              const remainingSlugs = selectedTagSlugs.filter(s => s !== tag.slug?.toLowerCase());
              m.route.set(m.route.get().replace(/\?.*$/, ''), { ...m.route.param(), tags: remainingSlugs.join(',') });
            }
          })
        )
      ),

      filteredTags.length === 0 ?
        m('.text-center text-base-content/70 py-10',
          globalThis.tagsListService.searchQuery ?
            'No tags found matching your search.' :
            selectedTags.length > 0 ?
              'All tags are already selected.' :
              'No tags yet. Create your first tag!'
        ) :
        m('ul.grid gap-1 @sm:gap-4 @md:gap-6 grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3',
          filteredTags.map((tag) =>
            m('li.list-none', { key: tag.id },
              m(m.route.Link, { href: m.route.get().replace(/\?.*$/, ''), params: { ...m.route.param(), tags: [...selectedTagSlugs, tag.slug].join(',') }, class: 'block' },
                m(TagCard, {
                  _tag: tag,
                })
              )
            )
          )
        )
    ]);
  }
}
