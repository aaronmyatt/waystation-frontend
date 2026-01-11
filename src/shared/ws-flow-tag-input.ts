import m from "mithril";
import { api } from "./api-client";

function debounce<T extends (...args: any[]) => void>(fn: T, wait = 300): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function(this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      fn.apply(this, args);
    }, wait);
  } as T;
}

export function TagBadge() {
  return {
    oninit(vnode){
      const params = m.buildQueryString({ tags: [vnode.attrs._tag.name].map(s => s.toLowerCase()).join(',') });
      vnode.state.slug = '/?' + params;
    },
    view(vnode) {
      return m('div.join.shadow-sm', [
        m(m.route.Link, {
          href: vnode.state.slug,
          class: 'btn btn-primary btn-sm join-item'
        }, m('span.font-medium', vnode.attrs._tag.name)),
        vnode.attrs.ondelete && m('button.btn btn-primary btn-sm join-item opacity-60 hover:opacity-90 border border-l-1', {
          onclick: (e) => {
            e.stopPropagation();
            vnode.attrs.ondelete(e)
          },
        }, '✕')
      ]);
      },
  }
}

export function TagsInput() {
  return {
    oninit(vnode){
      vnode.state.toggleAdd = vnode.attrs.enableCrud;
      vnode.state.toggleSearch = false;
      vnode.state.flowTags = [];
      vnode.state.choices = [];
      vnode.state.flowId = vnode.attrs?.flow?.id;

      if (vnode.state.flowId) {
        api.flowTags.get(vnode.state.flowId)
          .then(({ data }) => {
            const tags = data.tags || [];
            vnode.state.flowTags = tags;
            m.redraw();
          });
      }

      vnode.state.debouncedSearch = debounce((query) => {
        api.tags.list({ query, per_page: 5 })
          .then(({ data }) => {
            vnode.state.choices = [{
              name: query,
            }, ...data.rows];
            m.redraw();
          });
      }, 200);

     vnode.attrs.enableCrud && api.tags.list({ per_page: 5 })
      .then(({ data }) => {
        vnode.state.choices = data.rows;
      })
    },
    view(vnode) {
      return m(
        ".tag-badge-list my-2",
        [
          m('div.flex.flex-wrap.items-center.gap-2', [
            vnode.state.flowTags.map((tag) => {
              return m(TagBadge, {
                _tag: tag,
                // careful, 'onremove' is a reserved attribute in mithril
                ondelete: vnode.attrs.enableCrud && (async () => {
                  try {
                    await api.tags.delete(tag.id, vnode.state.flowId);
                    vnode.state.flowTags = vnode.state.flowTags.filter((o) => o.id !== tag.id);
                    // globalThis.tagsListService.delete(tag.id);
                  } catch (err) {
                    console.error('Failed to delete tag', err);
                  } finally {
                    m.redraw();
                  }
                })
              })}
            ),
            vnode.state.toggleAdd && m('button.btn.btn-sm.btn-outline', {
              onclick: () => {
                vnode.state.toggleAdd = false;
                vnode.state.toggleSearch = true;
              }
            }, '# Add Tag'),
          ]),
          vnode.state.options === 0 && m(".text-sm text-base-content/70", "Loading tags..."),
          vnode.state.toggleSearch && m('div.mt-2',
            [
              m('input.input input-bordered w-full mb-2', {
                oncreate: (inputVnode) => {
                  vnode.state.inputEl = inputVnode.dom as HTMLInputElement;
                  vnode.state.inputEl.focus();
                },
                type: 'text',
                placeholder: 'Search tags...',
                value: vnode.state.query || '',
                oninput: (e) => {
                  vnode.state.query = e.target.value;
                  vnode.state.debouncedSearch(vnode.state.query);
                },
                onblur: (e) => {
                  const next = e.relatedTarget as HTMLElement | null;
                  const isDropdownTarget = !!(next && vnode.state.dropdownEl && vnode.state.dropdownEl.contains(next));

                  // If the blur was caused by interacting with the dropdown (e.g., mousedown),
                  // re-focus the input and keep the dropdown open so the click can resolve.
                  if (vnode.state.dropdownPointerDown) {
                    vnode.state.inputEl?.focus();
                    return;
                  }

                  if (!isDropdownTarget) {
                    vnode.state.toggleAdd = true;
                    vnode.state.toggleSearch = false;
                    m.redraw();
                  }
                },
              }),
              m('.dropdown dropdown-open w-full', {
                oncreate: (ddVnode) => {
                  vnode.state.dropdownEl = ddVnode.dom;
                }
              }, [
                m('div.dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto',
                  vnode.state.choices.map((tag) =>
                    m('button.btn btn-ghost btn-sm w-full justify-start text-left', {
                      onclick: async () => {
                        if (!vnode.state.flowTags.find((o) => o.id === tag.id)) {
                          try {
                            const { data } = await api.tags.create({ tag: { name: tag.name } }, vnode.state.flowId);
                            vnode.state.flowTags.push(data.tag);
                            globalThis.tagsListService.push(data.tag);
                          } catch (err) {
                            console.error('Failed to create tag', err);
                          } finally {
                            vnode.state.toggleAdd = true;
                            vnode.state.toggleSearch = false;
                            m.redraw();
                          }
                        }
                      }
                    }, tag.id ? tag.name : `+ Create "${tag.name}"`)
                  )
                )
              ])
          ]
      )]);
    },
  };
}
