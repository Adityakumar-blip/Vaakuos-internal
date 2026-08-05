import React, { useEffect, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Plus } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TableEdgeMenuProps {
    editor: Editor;
}

export const TableEdgeMenu: React.FC<TableEdgeMenuProps> = ({ editor }) => {
    const [tableRect, setTableRect] = useState<DOMRect | null>(null);

    const updatePosition = useCallback(() => {
        if (!editor || editor.isDestroyed || !editor.isActive('table')) {
            setTableRect(null);
            return;
        }

        const view = editor.view;
        const selection = view.state.selection;

        // Find the active table node in the DOM
        let domNode = view.domAtPos(selection.from).node as HTMLElement;
        while (domNode && domNode.nodeName !== 'TABLE' && domNode !== view.dom) {
            domNode = domNode.parentElement as HTMLElement;
        }

        if (domNode && domNode.nodeName === 'TABLE') {
            const rect = domNode.getBoundingClientRect();
            setTableRect(rect);
        } else {
            setTableRect(null);
        }
    }, [editor]);

    useEffect(() => {
        editor.on('selectionUpdate', updatePosition);
        editor.on('update', updatePosition);
        window.addEventListener('resize', updatePosition);
        // We also want to update on scroll since the table could move
        const scrollContainer = document.querySelector('.Editor') || window;
        scrollContainer.addEventListener('scroll', updatePosition, true);

        return () => {
            editor.off('selectionUpdate', updatePosition);
            editor.off('update', updatePosition);
            window.removeEventListener('resize', updatePosition);
            scrollContainer.removeEventListener('scroll', updatePosition, true);
        };
    }, [editor, updatePosition]);

    if (!tableRect) return null;

    const handleDragAdd = (e: React.MouseEvent, type: 'row' | 'col') => {
        e.preventDefault();
        e.stopPropagation();

        let startCoord = type === 'row' ? e.clientY : e.clientX;
        let hasMoved = false;

        // Threshold in pixels to drag before a new row/col is added
        const THRESHOLD = type === 'row' ? 35 : 75;

        const onMouseMove = (moveEvent: MouseEvent) => {
            hasMoved = true;
            const currentCoord = type === 'row' ? moveEvent.clientY : moveEvent.clientX;
            const delta = currentCoord - startCoord;

            if (delta > THRESHOLD) {
                const count = Math.floor(delta / THRESHOLD);
                for (let i = 0; i < count; i++) {
                    if (type === 'row') {
                        editor.chain().focus().addRowAfter().run();
                    } else {
                        editor.chain().focus().addColumnAfter().run();
                    }
                }
                startCoord += count * THRESHOLD;
                updatePosition();
            }
        };

        const onMouseUp = () => {
            if (!hasMoved) {
                // Treat as simple click
                if (type === 'row') {
                    editor.chain().focus().addRowAfter().run();
                } else {
                    editor.chain().focus().addColumnAfter().run();
                }
                setTimeout(updatePosition, 50);
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return createPortal(
        <>
            {/* Right Edge - Add Column */}
            <div
                className="fixed z-40 flex items-center justify-center transition-all group"
                style={{
                    top: tableRect.top,
                    left: tableRect.right + 4,
                    height: tableRect.height,
                    width: '16px',
                    cursor: 'col-resize'
                }}
                onMouseDown={(e) => handleDragAdd(e, 'col')}
            >
                <div className="w-1 h-full bg-border/50 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-popover border border-border rounded-full shadow-sm p-0.5">
                        <Plus className="w-3 h-3 text-muted-foreground" />
                    </div>
                </div>
            </div>

            {/* Bottom Edge - Add Row */}
            <div
                className="fixed z-40 flex items-center justify-center transition-all group"
                style={{
                    top: tableRect.bottom + 4,
                    left: tableRect.left,
                    width: tableRect.width,
                    height: '16px',
                    cursor: 'row-resize'
                }}
                onMouseDown={(e) => handleDragAdd(e, 'row')}
            >
                <div className="h-1 w-full bg-border/50 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-popover border border-border rounded-full shadow-sm p-0.5">
                        <Plus className="w-3 h-3 text-muted-foreground" />
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};
