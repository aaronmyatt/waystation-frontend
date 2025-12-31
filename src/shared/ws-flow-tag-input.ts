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
    view(vnode) {
      return m(
        ".tag-badge-list",
        [vnode.state.flowTags.length > 0 && 
          m('ul.flex.flex-wrap',
            vnode.state.flowTags.map((option) =>
              m(
                ".badge badge-lg mr-2 mb-2",
                
                [m('span',option.label),
                  m('button.btn btn-sm btn-circle btn-ghost ml-2', {
                    onclick: () => {
                      vnode.state.flowTags = vnode.state.flowTags.filter((o) => o.value !== option.value);
                      m.redraw();
                    }
                  }, '×')
                ]
              )
            )
          ),
          vnode.state.options === 0 && m(".text-sm text-base-content/70", "Loading tags..."),
          !vnode.state.toggleAdd && m('button.btn btn-sm btn-outline mt-2', {
              onclick: () => {
                vnode.state.toggleAdd = !vnode.state.toggleAdd;
              }
          }, 'Add Tag'),
          vnode.state.toggleAdd && m('div.mt-2',
            [
              m('input.input input-bordered w-full mb-2', {
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
              }),
              m('.dropdown dropdown-open w-full', [
                m('div.dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto', { tabindex: 0 },
                  vnode.state.choices.map((option) =>
                    m('button.btn btn-ghost btn-sm w-full justify-start text-left', {
                      onclick: () => {
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
