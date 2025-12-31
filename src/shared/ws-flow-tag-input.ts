import m from "mithril";
import { api } from "./api-client";

export function TagsInput() {
  return {
    oninit(vnode){
      vnode.state.toggleAdd = false;
      vnode.state.flowTags = [];
      vnode.state.choices = [];

      api.tags.list({ per_page: 5 })
      .then(({ data }) => {
        vnode.state.choices = data.rows.map((tag) => {
          return { value: tag.id, label: tag.name };
        });
      })
    },
    onupdate(vnode){
      console.log('tags input updated', vnode.state.flowTags);
    },
    view(vnode) {
      return m(
        ".tag-badge-list",
        [
          m('div.flex.flex-wrap.items-center.gap-2', [
            vnode.state.flowTags.map((option) =>
              m(
                "span.badge.badge-lg.badge-primary.shadow-sm.flex.items-center.gap-2.border.border-primary/20",
                [
                  m('span.font-medium', option.label),
                  m('button.btn.btn-ghost.btn-xs.btn-circle', {
                    onclick: () => {
                      vnode.state.flowTags = vnode.state.flowTags.filter((o) => o.value !== option.value);
                      m.redraw();
                    }
                  }, '✕')
                ]
              )
            ),
            !vnode.state.toggleAdd && m('button.btn.btn-sm.btn-outline', {
              onclick: () => {
                vnode.state.toggleAdd = true;
              }
            }, 'Add Tag'),
          ]),
          vnode.state.options === 0 && m(".text-sm text-base-content/70", "Loading tags..."),
          vnode.state.toggleAdd && m('div.mt-2',
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
                  api.tags.list({ query: vnode.state.query, per_page: 5 })
                  .then(({ data }) => {
                    vnode.state.choices = data.rows.map((tag) => {
                      return { value: tag.id, label: tag.name };
                    });
                    m.redraw();
                  });
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
                    vnode.state.toggleAdd = false;
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
                  vnode.state.choices.map((option) =>
                    m('button.btn btn-ghost btn-sm w-full justify-start text-left', {
                      onclick: () => {
                        console.log('adding tag', option);
                        if (!vnode.state.flowTags.find((o) => o.value === option.value)) {
                          vnode.state.flowTags.push(option);
                          vnode.state.toggleAdd = false;
                          m.redraw();
                        }
                      }
                    }, option.label)
                  )
                )
              ])
          ]
      )]);
    },
  };
}
