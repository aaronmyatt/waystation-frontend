import m from 'mithril';
import { FlowRelationService } from '../services/flow-relation';

interface FlowParentChildDrawerAttrs {
  flow: any;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * FlowParentChildDrawer is a side drawer component that displays parent and child flow relationships.
 * It uses daisyUI's drawer component for the UI and FlowRelationService to manage data.
 * 
 * This component shows:
 * - Parent flow (if this flow was copied from another)
 * - Child flows (flows that were created as copies/branches from this flow)
 * 
 * Users can navigate to related flows by clicking on them.
 */
export function FlowParentChildDrawer(): m.Component<FlowParentChildDrawerAttrs> {
  // Create a component-local instance of FlowRelationService
  // This keeps state independent for different drawer instances
  let relationService: FlowRelationService;

  return {
    oninit(vnode) {
      // Initialize the service
      relationService = new FlowRelationService();
      
      // If drawer is initially open and we have a flow, fetch relations
      if (vnode.attrs.isOpen && vnode.attrs.flow?.id) {
        relationService.fetchRelations(vnode.attrs.flow.id);
      }
    },

    onbeforeupdate(vnode, old) {
      // If the flow changed or drawer just opened, fetch new relations
      const flowChanged = vnode.attrs.flow?.id !== old.attrs.flow?.id;
      const justOpened = vnode.attrs.isOpen && !old.attrs.isOpen;
      
      if ((flowChanged || justOpened) && vnode.attrs.flow?.id) {
        relationService.fetchRelations(vnode.attrs.flow.id);
      }

      // If drawer is closed, we could optionally reset the service
      // but keeping data allows smoother reopening
    },

    view(vnode) {
      const { flow, isOpen, onClose } = vnode.attrs;

      return m('.drawer drawer-end', {
        class: isOpen ? 'drawer-open' : ''
      }, [
        // Drawer content - this is required by daisyUI but not used in this case
        m('.drawer-content'),

        // Drawer side panel
        m('.drawer-side', { style: { zIndex: 1000 } }, [
          // Overlay to close drawer when clicking outside
          m('label.drawer-overlay', {
            onclick: onClose,
            'aria-label': 'Close sidebar'
          }),

          // Drawer panel content
          m('.bg-base-200 text-base-content min-h-full w-80 md:w-96 p-4 flex flex-col', [
            // Header with close button
            m('.flex justify-between items-center mb-4 pb-3 border-b border-base-300', [
              m('h2.text-lg font-semibold', 'Flow Relations'),
              m('button.btn btn-sm btn-circle btn-ghost', {
                onclick: onClose,
                'aria-label': 'Close'
              }, '✕')
            ]),

            // Loading state
            relationService.loading && m('.flex justify-center items-center py-8', [
              m('span.loading loading-spinner loading-lg')
            ]),

            // Error state
            relationService.error && m('.alert alert-error mb-4', [
              m('span', relationService.error)
            ]),

            // Content - show when not loading
            !relationService.loading && m('.flex-1 overflow-y-auto', [
              // Parent flow section
              m('.mb-6', [
                m('h3.text-sm font-semibold text-base-content/70 uppercase mb-3', 'Parent Flow'),
                relationService.parent 
                  ? m('.card card-compact bg-base-100 shadow-sm', [
                      m('.card-body', [
                        m('h4.card-title text-base', relationService.parent.name),
                        relationService.parent.description && 
                          m('p.text-sm text-base-content/70 line-clamp-2', relationService.parent.description),
                        m('.card-actions justify-end mt-2', [
                          m(m.route.Link, {
                            href: `/flow/${relationService.parent.id}`,
                            class: 'btn btn-sm btn-primary',
                            onclick: onClose // Close drawer when navigating
                          }, 'Open')
                        ])
                      ])
                    ])
                  : m('p.text-sm text-base-content/50 italic', 'No parent flow')
              ]),

              // Children flows section
              m('.mb-6', [
                m('h3.text-sm font-semibold text-base-content/70 uppercase mb-3', [
                  'Child Flows ',
                  relationService.children.length > 0 && 
                    m('span.badge badge-sm badge-neutral', relationService.children.length)
                ]),
                relationService.children.length > 0
                  ? m('.space-y-2', relationService.children.map((child: any) =>
                      m('.card card-compact bg-base-100 shadow-sm', {
                        key: child.id
                      }, [
                        m('.card-body', [
                          m('h4.card-title text-base', child.name),
                          child.description && 
                            m('p.text-sm text-base-content/70 line-clamp-2', child.description),
                          m('.card-actions justify-end mt-2', [
                            m(m.route.Link, {
                              href: `/flow/${child.id}`,
                              class: 'btn btn-sm btn-primary',
                              onclick: onClose // Close drawer when navigating
                            }, 'Open')
                          ])
                        ])
                      ])
                    ))
                  : m('p.text-sm text-base-content/50 italic', 'No child flows')
              ]),

              // Info message when no relations exist
              !relationService.hasRelations() && !relationService.loading && !relationService.error &&
                m('.alert alert-info', [
                  m('svg', {
                    xmlns: 'http://www.w3.org/2000/svg',
                    fill: 'none',
                    viewBox: '0 0 24 24',
                    class: 'stroke-current shrink-0 w-6 h-6'
                  }, [
                    m('path', {
                      'stroke-linecap': 'round',
                      'stroke-linejoin': 'round',
                      'stroke-width': '2',
                      d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    })
                  ]),
                  m('span', 'This flow has no parent or child flows.')
                ])
            ])
          ])
        ])
      ]);
    }
  };
}
