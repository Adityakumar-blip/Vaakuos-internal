import React from 'react';
import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import '@tiptap/extension-table';
import { Trash2, Plus, Minus, Type, Columns, Rows } from 'lucide-react';

interface TableMenuProps {
    editor: Editor;
}

export const TableMenu: React.FC<TableMenuProps> = ({ editor }) => {
    if (!editor) return null;

    const shouldShow = ({ editor }: { editor: Editor }) => {
        return editor.isActive('table');
    };

    return (
        <BubbleMenu
            editor={editor}
            options={{ placement: 'right-start' }}
            shouldShow={shouldShow}
            className="flex flex-col bg-popover/95 backdrop-blur-md border border-border shadow-xl rounded-xl overflow-hidden z-50 text-foreground w-56 text-sm"
        >
            <div className="py-1">
                {/* Column Operations */}
                <span className="text-[10px] font-semibold px-3 py-1 text-muted-foreground uppercase tracking-wider block bg-muted/30">Columns</span>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().addColumnBefore().run(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-muted/80 transition-colors flex items-center gap-2 group"
                >
                    <Columns className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                    Insert column left
                </button>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-muted/80 transition-colors flex items-center gap-2 group"
                >
                    <Columns className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                    Insert column right
                </button>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2 group"
                >
                    <Minus className="w-3.5 h-3.5" />
                    Delete column
                </button>

                <div className="h-px bg-border/50 my-1"></div>

                {/* Row Operations */}
                <span className="text-[10px] font-semibold px-3 py-1 text-muted-foreground uppercase tracking-wider block bg-muted/30">Rows</span>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().addRowBefore().run(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-muted/80 transition-colors flex items-center gap-2 group"
                >
                    <Rows className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                    Insert row above
                </button>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-muted/80 transition-colors flex items-center gap-2 group"
                >
                    <Rows className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                    Insert row below
                </button>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2 group"
                >
                    <Minus className="w-3.5 h-3.5" />
                    Delete row
                </button>

                <div className="h-px bg-border/50 my-1"></div>

                {/* Table Settings */}
                <span className="text-[10px] font-semibold px-3 py-1 text-muted-foreground uppercase tracking-wider block bg-muted/30">Settings</span>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeaderRow().run(); }}
                    className={`w-full text-left px-3 py-1.5 transition-colors flex items-center gap-2 group ${editor.isActive('table', { headerRow: true }) ? 'bg-primary/10 text-primary' : 'hover:bg-muted/80'}`}
                >
                    <Type className="w-3.5 h-3.5" />
                    Header Row
                </button>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2 group"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Table
                </button>
            </div>
        </BubbleMenu>
    );
};

