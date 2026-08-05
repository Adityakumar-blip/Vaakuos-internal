import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { TurnIntoMenu, getBlockTypeLabel } from './TurnIntoMenu';

interface BlockContextMenuProps {
    editor: Editor;
    nodePos: number | null;
    position: { top: number; left: number };
    onClose: () => void;
}

export const BlockContextMenu: React.FC<BlockContextMenuProps> = ({
    editor,
    nodePos,
    position,
    onClose,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [activeSubmenu, setActiveSubmenu] = useState<'none' | 'turnInto' | 'color'>('none');

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    // Adjust position to keep menu in viewport
    useEffect(() => {
        if (!menuRef.current) return;
        const rect = menuRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (rect.right > vw) {
            menuRef.current.style.left = `${position.left - rect.width - 8}px`;
        }
        if (rect.bottom > vh) {
            menuRef.current.style.top = `${Math.max(8, vh - rect.height - 8)}px`;
        }
    }, [position]);

    const duplicateNode = () => {
        if (nodePos === null) return;
        const node = editor.state.doc.nodeAt(nodePos);
        if (!node) return;

        const endPos = nodePos + node.nodeSize;
        editor.chain().insertContentAt(endPos, node.toJSON()).focus().run();
        onClose();
    };

    const deleteNode = () => {
        if (nodePos === null) return;
        const node = editor.state.doc.nodeAt(nodePos);
        if (!node) return;

        const tr = editor.state.tr.delete(nodePos, nodePos + node.nodeSize);
        editor.view.dispatch(tr);
        editor.commands.focus();
        onClose();
    };

    const copyNode = () => {
        if (nodePos === null) return;
        const node = editor.state.doc.nodeAt(nodePos);
        if (!node) return;

        // Copy as plain text content
        const text = node.textContent;
        navigator.clipboard.writeText(text);
        onClose();
    };

    const resetFormatting = () => {
        editor.chain().focus().clearNodes().unsetAllMarks().run();
        onClose();
    };

    const copyAnchorLink = () => {
        if (nodePos === null) return;
        const node = editor.state.doc.nodeAt(nodePos);
        if (!node) return;

        // Generate a slug from the node's text content
        const text = node.textContent || '';
        const slug = text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

        const anchor = `#${slug || 'block'}`;
        navigator.clipboard.writeText(window.location.href.split('#')[0] + anchor);
        onClose();
    };

    const blockLabel = getBlockTypeLabel(editor);

    return (
        <div
            ref={menuRef}
            className="block-context-menu"
            style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                zIndex: 70,
            }}
        >
            <div className="relative w-full">
                <button
                    type="button"
                    className={`context-item justify-between ${activeSubmenu === 'turnInto' ? 'active' : ''}`}
                    onClick={() => setActiveSubmenu(activeSubmenu === 'turnInto' ? 'none' : 'turnInto')}
                >
                    <div className="flex items-center">
                        <span>Turn into</span>
                    </div>
                    <div className="flex items-center text-muted-foreground mr-1">
                        <span className="text-xs mr-1">{blockLabel}</span>
                        <ChevronRight size={14} className="opacity-70" />
                    </div>
                </button>

                {activeSubmenu === 'turnInto' && (
                    <div className="absolute top-0 left-full ml-2 w-48 z-50">
                        <TurnIntoMenu editor={editor} onClose={onClose} />
                    </div>
                )}
            </div>

            <div className="context-divider" />

            {/* Copy anchor link */}
            <button type="button" className="context-item" onClick={copyAnchorLink}>
                <span>Copy Link to Block</span>
            </button>

            {/* Duplicate */}
            <button type="button" className="context-item" onClick={duplicateNode}>
                <span>Duplicate</span>
            </button>

            {/* Delete */}
            <button type="button" className="context-item text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={deleteNode}>
                <span>Delete</span>
            </button>
        </div>
    );
};
