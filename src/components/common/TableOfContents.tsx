import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';

interface TocItem {
    id: string;
    text: string;
    level: number;
    pos: number;
}

interface TableOfContentsProps {
    editor: Editor | null;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ editor }) => {
    const [items, setItems] = useState<TocItem[]>([]);

    useEffect(() => {
        if (!editor) return;

        const updateToc = () => {
            const headings: TocItem[] = [];

            editor.state.doc.descendants((node, pos) => {
                if (node.type.name === 'heading') {
                    // Generate a unique ID based on the text content to prevent unnecessary re-renders
                    // but we will use the ProseMirror 'pos' for actual scrolling
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

            // Only update state if headings actually changed (prevent React re-render loops)
            setItems(prev => {
                const isSame = prev.length === headings.length && prev.every((p, i) => p.id === headings[i].id && p.text === headings[i].text);
                return isSame ? prev : headings;
            });
        };

        updateToc();
        editor.on('update', updateToc);

        return () => {
            editor.off('update', updateToc);
        };
    }, [editor]);

    if (items.length === 0) return null;

    return (
        <div className="hidden xl:block w-64 absolute top-6 -right-72 animate-in fade-in slide-in-from-right-4 duration-500 z-10 transition-all">
            <div className="bg-popover/80 backdrop-blur-sm border border-border/40 shadow-sm rounded-xl p-4 sticky top-24 max-h-[calc(100vh-200px)] overflow-y-auto">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3 px-2">Table of Contents</h3>
                <ul className="flex flex-col gap-[2px]">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
                            className="group"
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    const nodeDOM = editor?.view.nodeDOM(item.pos);
                                    if (nodeDOM && nodeDOM instanceof HTMLElement) {
                                        nodeDOM.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }}
                                className="text-[13px] text-muted-foreground/90 hover:text-foreground hover:bg-muted/50 rounded-md py-1 px-2 w-full text-left line-clamp-1 transition-colors"
                            >
                                {item.text}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
