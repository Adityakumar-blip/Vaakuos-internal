import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TableOfContentsView } from '../components/TableOfContentsView';

export const TableOfContentsNode = Node.create({
    name: 'tableOfContents',
    group: 'block',
    atom: true,

    parseHTML() {
        return [
            {
                tag: 'div[data-type="toc"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toc' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(TableOfContentsView);
    },
});
