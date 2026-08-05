import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance, Props } from 'tippy.js';
import { MentionList, MentionListRef } from '../components/MentionList';
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';

// Dummy users map
const MOCK_USERS = [
    { id: '1', name: 'Emily Johnson', role: 'Engineering' },
    { id: '2', name: 'Michael Thompson', role: 'Product' },
    { id: '3', name: 'Sophia Lee', role: 'Design' },
    { id: '4', name: 'William Davis', role: 'Analytics' },
    { id: '5', name: 'Olivia Wilson', role: 'Marketing' },
    { id: '6', name: 'Daniel Taylor', role: 'Engineering' },
    { id: '7', name: 'Isabella Anderson', role: 'Support' },
    { id: '8', name: 'Jacob Martinez', role: 'Sales' },
];

export const MentionSuggestion = {
    items: ({ query }: { query: string }) => {
        return MOCK_USERS.filter(item => item.name.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5);
    },

    render: () => {
        let component: ReactRenderer;
        let popup: Instance<Props>[];

        return {
            onStart: (props: SuggestionProps) => {
                component = new ReactRenderer(MentionList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect as () => DOMRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props: SuggestionProps) {
                component.updateProps(props);

                if (!props.clientRect) return;

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect as () => DOMRect,
                });
            },

            onKeyDown(props: SuggestionKeyDownProps) {
                if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                }
                return (component.ref as MentionListRef)?.onKeyDown(props);
            },

            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
};
