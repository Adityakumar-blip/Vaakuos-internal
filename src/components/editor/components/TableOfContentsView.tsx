import React, { useEffect, useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';

interface TocItem {
    id: string;
    text: string;
    level: number;
    pos: number;
}

export const TableOfContentsView: React.FC<NodeViewProps> = ({ editor }) => {
    const [items, setItems] = useState<TocItem[]>([]);

    useEffect(() => {
        if (!editor) return;

        const updateToc = () => {
            const headings: TocItem[] = [];

            editor.state.doc.descendants((node, pos) => {
                if (node.type.name === 'heading') {
                    const slug = node.textContent
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)+/g, '');

                    headings.push({
                        id: `${slug}-${pos}`,
                        text: node.textContent,
                        level: node.attrs.level,
                        pos: pos,
                    });
                }
            });

            setItems(prev => {
                const isSame = prev.length === headings.length && prev.every((p, i) => p.id === headings[i].id && p.text === headings[i].text);
                return isSame ? prev : headings;
            });
        };

        // Initial update
        updateToc();

        // Listen for editor updates
        editor.on('update', updateToc);

        return () => {
            editor.off('update', updateToc);
        };
    }, [editor]);

    return (
        <NodeViewWrapper className="toc-node-wrapper my-6 p-4 bg-muted/30 rounded-lg border border-border/50">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Table of contents</h3>
            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground/60 italic">Add headings to see them here.</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            style={{ paddingLeft: `${(item.level - 1) * 1}rem` }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    const nodeDOM = editor?.view.nodeDOM(item.pos);
                                    if (nodeDOM && nodeDOM instanceof HTMLElement) {
                                        nodeDOM.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }}
                                className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors text-left line-clamp-1"
                            >
                                {item.text}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </NodeViewWrapper>
    );
};
