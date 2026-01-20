// when opened, shows a list of the parent/child relationships of the current flow
// clicking on one opens a preview of that flow in the drawer
import m from 'mithril';
import { FlowPreview } from '../shared/ws-flow-preview';

interface FlowParentChildDrawerAttrs {
    flow: any;
    onClose: () => void;
}

export function FlowParentChildDrawer(): m.Component<FlowParentChildDrawerAttrs> {
    return {
        view(vnode) {
            const { flow, onClose } = vnode.attrs;
            const [parentFlow, childFlows] = globalThis.flowRelationService.getRelations(flow);

            return m('.fixed inset-0 bg-black bg-opacity-50 flex justify-end',
                m('.bg-white w-1/3 h-full shadow-lg overflow-y-auto',
                    m('.p-4 border-b flex justify-between items-center',
                        m('h2.text-xl.font-bold', 'Parent/Child Flows'),
                        m('button.text-gray-500.hover:text-gray-700', { onclick: onClose }, 'Close')
                    ),
                    m('.p-4',
                        m('h3.text-lg.font-semibold.mb-2', 'Parent Flows'),
                        parentFlow 
                            ? m('p.text-gray-500', 'No parent flows.') 
                            : m('li.mb-2',
                                m('button.text-blue-600.hover:underline', {
                                    onclick: () => {
                                        globalThis.flowService.setPreviewFlow(parentFlow);
                                    }
                                }, parentFlow.flow.name)
                            ),
                        m('h3.text-lg.font-semibold.mt-6.mb-2', 'Child Flows'),
                        childFlows.length === 0
                            ? m('p.text-gray-500', 'No child flows.')
                            : m('ul.list-disc.list-inside',
                                childFlows.map(childFlow =>
                                    m('li.mb-2',
                                        m('button.text-blue-600.hover:underline', {
                                            onclick: () => {
                                                globalThis.flowService.setPreviewFlow(childFlow);
                                            }
                                        }, childFlow.flow.name)
                                    )
                                )
                            )
                    )
                )
            );
        }
    };
}