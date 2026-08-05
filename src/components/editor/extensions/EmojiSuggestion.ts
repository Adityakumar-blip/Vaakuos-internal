import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance, Props } from 'tippy.js';
import { EmojiList, EmojiListRef } from '../components/EmojiList';
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';

export const COMMON_EMOJIS = [
    { name: 'smile', char: '😀' },
    { name: 'sweat_smile', char: '😅' },
    { name: 'joy', char: '😂' },
    { name: 'heart_eyes', char: '😍' },
    { name: 'star_struck', char: '🤩' },
    { name: 'sunglasses', char: '😎' },
    { name: 'thinking', char: '🤔' },
    { name: 'thumbs_up', char: '👍' },
    { name: 'clap', char: '👏' },
    { name: 'fire', char: '🔥' },
    { name: 'sparkles', char: '✨' },
    { name: 'rocket', char: '🚀' },
    { name: 'eyes', char: '👀' },
    { name: 'check', char: '✅' },
    { name: 'cross', char: '❌' },
    { name: 'warning', char: '⚠️' },
    { name: 'bulb', char: '💡' },
    { name: 'tada', char: '🎉' },
    { name: 'folded_hands', char: '🙏' },
    { name: '100', char: '💯' },
];

export const EmojiSuggestion = {
    items: ({ query }: { query: string }) => {
        return COMMON_EMOJIS.filter(item => item.name.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10);
    },

    render: () => {
        let component: ReactRenderer;
        let popup: Instance<Props>[];

        return {
            onStart: (props: SuggestionProps) => {
                component = new ReactRenderer(EmojiList, {
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
                return (component.ref as EmojiListRef)?.onKeyDown(props);
            },

            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
};
