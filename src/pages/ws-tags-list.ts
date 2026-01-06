import m from 'mithril'
import { _events, dispatch } from '../shared/utils'
import { TagBadge } from '../shared/ws-flow-tag-input'

const TagCard = {
  view(vnode) {
    return m('.card card-xs @sm:card-md @md:card-lg bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300 border border-base-300 h-full',
      m('.card-body',
        [
          m('.flex items-center gap-1 @sm:gap-2',
            [
              vnode.attrs.color && m('.badge', {
                style: `background-color: ${vnode.attrs.color}; color: white;`
              }, ''),
              m('.card-title text-md @sm:text-lg font-semibold text-primary', vnode.attrs.name || 'Untitled Tag'),
            ]
          ),
          vnode.attrs.slug && m('.text-xs @sm:text-sm text-base-content/70', `Slug: ${vnode.attrs.slug}`)
        ]
      )
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
    dispatch(_events.action.refreshTagsList, {
      params: {
        per_page: 100, page: 1, 
      }
    });
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
      m('h1.text-3xl font-bold mb-6', 'Tags'),
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
              if (remainingSlugs.length > 0) {
                m.route.set('/', { tags: remainingSlugs.join(',') });
              } else {
                m.route.set('/');
              }
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
              m(m.route.Link, { href: `/?${m.buildQueryString({
                tags: [...selectedTagSlugs, tag.slug].join(',')
              })}`, class: 'block' },
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
