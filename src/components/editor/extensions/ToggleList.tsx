import { mergeAttributes, Node, wrappingInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        toggleBlock: {
            setDetails: () => ReturnType;
        }
    }
}

/* ---- React Component for the Toggle ---- */
const ToggleNodeView = (props: NodeViewProps) => {
    const { selected } = props;
    const [open, setOpen] = useState(true);

    return (
        <NodeViewWrapper
            className={`toggle-list-wrapper my-1 ${open ? 'toggle-open' : 'toggle-closed'}`}
        >
            <div className={`toggle-list ${selected ? 'ring-2 ring-primary/30 ring-offset-1' : ''}`}>
                <div
                    className="toggle-list-header"
                    contentEditable={false}
                >
                    <button
                        type="button"
                        className={`toggle-list-arrow ${open ? 'open' : ''}`}
                        onClick={() => setOpen(!open)}
                        contentEditable={false}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
                <div className="toggle-list-body">
                    <NodeViewContent className="toggle-list-content" />
                </div>
            </div>
        </NodeViewWrapper>
    );
};

/* ---- Tiptap Node Extension ---- */

// Main Toggle List node
export const ToggleList = Node.create({
    name: 'toggleBlock',
    group: 'block',
    content: 'block+',
    defining: true,
    draggable: true,

    addAttributes() {
        return {
            open: {
                default: true,
                parseHTML: (element: HTMLElement) => element.getAttribute('data-open') !== 'false',
                renderHTML: (attributes: { open: boolean }) => ({
                    'data-open': attributes.open ? 'true' : 'false',
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="toggle-list"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle-list', class: 'toggle-list' }), 0];
    },

    addCommands() {
        return {
            setDetails: () => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    content: [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Toggle title' }],
                        },
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Hidden content goes here...' }],
                        },
                    ],
                });
            },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(ToggleNodeView);
    },

    addInputRules() {
        return [
            wrappingInputRule({
                find: /^>\s$/,
                type: this.type,
            }),
        ];
    },
});
