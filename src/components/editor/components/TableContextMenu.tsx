import React, { useEffect, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
    Trash2, Plus, Minus, Type, Columns, Rows,
    ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
    ArrowDownAZ, ArrowUpZA, Palette, AlignLeft,
    AlignCenter, AlignRight, Copy, X, ChevronRight,
    ChevronLeft, ArrowUpToLine, ArrowDownToLine,
    AlignVerticalSpaceAround, Merge, Split
} from 'lucide-react';
import { createPortal } from 'react-dom';
import {
    clearColumn, clearRow, duplicateColumn, duplicateRow,
    moveColumn, moveRow, sortColumn, setColumnAlignment,
    setColumnBackgroundColor, setRowBackgroundColor,
    selectColumnCells, selectRowCells
} from '../utils/tableUtils';

interface TableContextMenuProps {
    editor: Editor;
}

type MenuState = 'main' | 'color' | 'alignment';

const COLORS = [
    { label: 'Default background', value: null, class: 'bg-background text-foreground' },
    { label: 'Gray background', value: '#f1f1ef', class: 'bg-[#f1f1ef] text-[#37352f]' },
    { label: 'Brown background', value: '#f4eeee', class: 'bg-[#f4eeee] text-[#37352f]' },
    { label: 'Orange background', value: '#fbedcc', class: 'bg-[#fbedcc] text-[#37352f]' },
    { label: 'Yellow background', value: '#fbf3db', class: 'bg-[#fbf3db] text-[#37352f]' },
    { label: 'Green background', value: '#edf3ec', class: 'bg-[#edf3ec] text-[#37352f]' },
    { label: 'Blue background', value: '#e7f3f8', class: 'bg-[#e7f3f8] text-[#37352f]' },
    { label: 'Purple background', value: '#f6f3f9', class: 'bg-[#f6f3f9] text-[#37352f]' },
    { label: 'Pink background', value: '#faf1f5', class: 'bg-[#faf1f5] text-[#37352f]' },
    { label: 'Red background', value: '#fdebec', class: 'bg-[#fdebec] text-[#37352f]' },
];

export const TableContextMenu: React.FC<TableContextMenuProps> = ({ editor }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [type, setType] = useState<'row' | 'col' | 'selection'>('row');
    const [index, setIndex] = useState(-1);
    const [pos, setPos] = useState(-1);
    const [view, setView] = useState<MenuState>('main');

    const handleDocumentClick = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const handle = target.closest('.table-row-handle, .table-col-handle') as HTMLElement | null;

        if (handle) {
            e.preventDefault();
            e.stopPropagation();

            const rect = handle.getBoundingClientRect();

            if (handle.classList.contains('table-row-handle')) {
                setType('row');
                const i = parseInt(handle.dataset.rowIndex || '-1', 10);
                const p = parseInt(handle.dataset.rowPos || '-1', 10);
                setIndex(i);
                setPos(p);
                setPosition({ top: rect.top + window.scrollY, left: rect.right + 10 + window.scrollX });
                selectRowCells(editor, i, p);
            } else {
                setType('col');
                const i = parseInt(handle.dataset.colIndex || '-1', 10);
                const p = parseInt(handle.dataset.cellPos || '-1', 10);
                setIndex(i);
                setPos(p);
                setPosition({ top: rect.bottom + 10 + window.scrollY, left: rect.left + window.scrollX });
                selectColumnCells(editor, i, p);
            }

            setView('main');
            setIsOpen(true);
        } else if (isOpen && !target.closest('.table-context-menu')) {
            setIsOpen(false);
        }
    }, [isOpen, editor]);

    const handleContextMenu = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const cell = target.closest('.tiptap table td, .tiptap table th') as HTMLElement | null;

        if (cell && !target.closest('.table-context-menu')) {
            e.preventDefault();
            e.stopPropagation();

            setType('selection');
            setPosition({ top: e.clientY + window.scrollY, left: e.clientX + window.scrollX });
            setView('main');
            setIsOpen(true);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('contextmenu', handleContextMenu);
        return () => {
            document.removeEventListener('click', handleDocumentClick);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [handleDocumentClick, handleContextMenu]);

    if (!isOpen || !editor) return null;

    const renderDivider = () => <div className="h-px bg-border/50 my-1"></div>;

    const renderMenuItem = (
        icon: React.ReactNode,
        label: string,
        onClick: () => void,
        hasSubmenu = false,
        danger = false
    ) => (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`w-full text-left px-3 py-1.5 transition-colors flex items-center justify-between group ${danger
                ? 'hover:bg-destructive/10 text-destructive'
                : 'hover:bg-muted/80 text-foreground'
                }`}
        >
            <div className="flex items-center gap-2">
                <span className={`flex items-center justify-center w-4 h-4 ${danger ? 'text-destructive' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {icon}
                </span>
                <span>{label}</span>
            </div>
            {hasSubmenu && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
    );

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    const canMerge = editor.can().mergeCells();
    const canSplit = editor.can().splitCell();

    const renderMainView = () => {
        if (type === 'selection') {
            return (
                <>
                    {canMerge && renderMenuItem(<Merge className="w-3.5 h-3.5" />, "Merge cells", () => handleAction(() => editor.chain().focus().mergeCells().run()))}
                    {canSplit && renderMenuItem(<Split className="w-3.5 h-3.5" />, "Split cell", () => handleAction(() => editor.chain().focus().splitCell().run()))}
                    {(canMerge || canSplit) && renderDivider()}
                    {renderMenuItem(<Palette className="w-3.5 h-3.5" />, "Color", () => setView('color'), true)}
                    {renderMenuItem(<AlignLeft className="w-3.5 h-3.5" />, "Alignment", () => setView('alignment'), true)}
                    {renderMenuItem(<X className="w-3.5 h-3.5" />, "Clear contents", () => handleAction(() => editor.chain().focus().deleteSelection().run()))}
                    {renderDivider()}
                    {renderMenuItem(<Plus className="w-3.5 h-3.5" />, "Insert row above", () => handleAction(() => editor.chain().focus().addRowBefore().run()))}
                    {renderMenuItem(<Plus className="w-3.5 h-3.5" />, "Insert row below", () => handleAction(() => editor.chain().focus().addRowAfter().run()))}
                    {renderMenuItem(<Plus className="w-3.5 h-3.5" />, "Insert column left", () => handleAction(() => editor.chain().focus().addColumnBefore().run()))}
                    {renderMenuItem(<Plus className="w-3.5 h-3.5" />, "Insert column right", () => handleAction(() => editor.chain().focus().addColumnAfter().run()))}
                    {renderDivider()}
                    {renderMenuItem(<Trash2 className="w-3.5 h-3.5" />, "Delete row", () => handleAction(() => editor.chain().focus().deleteRow().run()))}
                    {renderMenuItem(<Trash2 className="w-3.5 h-3.5" />, "Delete column", () => handleAction(() => editor.chain().focus().deleteColumn().run()))}
                </>
            );
        } else if (type === 'col') {
            return (
                <>
                    {canMerge && renderMenuItem(<Merge className="w-3.5 h-3.5" />, "Merge cells", () => handleAction(() => editor.chain().focus().mergeCells().run()))}
                    {canSplit && renderMenuItem(<Split className="w-3.5 h-3.5" />, "Split cell", () => handleAction(() => editor.chain().focus().splitCell().run()))}
                    {(canMerge || canSplit) && renderDivider()}
                    {renderMenuItem(<ArrowLeft className="w-3.5 h-3.5" />, "Move column left", () => handleAction(() => moveColumn(editor, index, pos, 'left')))}
                    {renderMenuItem(<ArrowRight className="w-3.5 h-3.5" />, "Move column right", () => handleAction(() => moveColumn(editor, index, pos, 'right')))}
                    {renderDivider()}
                    {renderMenuItem(<Plus className="w-3.5 h-3.5" />, "Insert column left", () => handleAction(() => {
                        editor.commands.setTextSelection(pos + 1);
                        editor.chain().focus().addColumnBefore().run();
                    }))}
                    {renderMenuItem(<Plus className="w-3.5 h-3.5" />, "Insert column right", () => handleAction(() => {
                        editor.commands.setTextSelection(pos + 1);
                        editor.chain().focus().addColumnAfter().run();
                    }))}
                    {renderDivider()}
                    {renderMenuItem(<ArrowDownAZ className="w-3.5 h-3.5" />, "Sort column A-Z", () => handleAction(() => sortColumn(editor, index, pos, 'asc')))}
                    {renderMenuItem(<ArrowUpZA className="w-3.5 h-3.5" />, "Sort column Z-A", () => handleAction(() => sortColumn(editor, index, pos, 'desc')))}
                    {renderDivider()}
                    {renderMenuItem(<Palette className="w-3.5 h-3.5" />, "Color", () => setView('color'), true)}
                    {renderMenuItem(<AlignLeft className="w-3.5 h-3.5" />, "Alignment", () => setView('alignment'), true)}
                    {renderMenuItem(<X className="w-3.5 h-3.5" />, "Clear column contents", () => handleAction(() => clearColumn(editor, index, pos)))}
                    {renderDivider()}
                    {renderMenuItem(<Copy className="w-3.5 h-3.5" />, "Duplicate column", () => handleAction(() => duplicateColumn(editor, index, pos)))}
                    {renderMenuItem(<Trash2 className="w-3.5 h-3.5" />, "Delete column", () => handleAction(() => {
                        editor.commands.setTextSelection(pos + 1);
                        editor.chain().focus().deleteColumn().run();
                    }))}
                    {renderDivider()}
                    {renderMenuItem(<Type className="w-3.5 h-3.5" />, "Toggle Header Column", () => handleAction(() => {
                        editor.commands.setTextSelection(pos + 1);
                        editor.chain().focus().toggleHeaderColumn().run();
                    }))}
                </>
            );
        } else {
            return (
                <>
                    {canMerge && renderMenuItem(<Merge className="w-3.5 h-3.5" />, "Merge cells", () => handleAction(() => editor.chain().focus().mergeCells().run()))}
                    {canSplit && renderMenuItem(<Split className="w-3.5 h-3.5" />, "Split cell", () => handleAction(() => editor.chain().focus().splitCell().run()))}
                    {(canMerge || canSplit) && renderDivider()}
                    {renderMenuItem(<ArrowUp className="w-3.5 h-3.5" />, "Move row up", () => handleAction(() => moveRow(editor, index, pos, 'up')))}
                    {renderMenuItem(<ArrowDown className="w-3.5 h-3.5" />, "Move row down", () => handleAction(() => moveRow(editor, index, pos, 'down')))}
                    {renderDivider()}
                    {renderMenuItem(<Plus className="w-3.5 h-3.5" />, "Insert row above", () => handleAction(() => {
                        editor.commands.setTextSelection(pos + 2);
                        editor.chain().focus().addRowBefore().run();
                    }))}
                    {renderMenuItem(<Plus className="w-3.5 h-3.5" />, "Insert row below", () => handleAction(() => {
                        editor.commands.setTextSelection(pos + 2);
                        editor.chain().focus().addRowAfter().run();
                    }))}
                    {renderDivider()}
                    {renderMenuItem(<Palette className="w-3.5 h-3.5" />, "Color", () => setView('color'), true)}
                    {renderMenuItem(<X className="w-3.5 h-3.5" />, "Clear row contents", () => handleAction(() => clearRow(editor, index, pos)))}
                    {renderDivider()}
                    {renderMenuItem(<Copy className="w-3.5 h-3.5" />, "Duplicate row", () => handleAction(() => duplicateRow(editor, index, pos)))}
                    {renderMenuItem(<Trash2 className="w-3.5 h-3.5" />, "Delete row", () => handleAction(() => {
                        editor.commands.setTextSelection(pos + 2);
                        editor.chain().focus().deleteRow().run();
                    }))}
                    {renderDivider()}
                    {renderMenuItem(<Type className="w-3.5 h-3.5" />, "Toggle Header Row", () => handleAction(() => {
                        editor.commands.setTextSelection(pos + 2);
                        editor.chain().focus().toggleHeaderRow().run();
                    }))}
                </>
            );
        }
    };

    const renderColorView = () => (
        <>
            <div className="flex items-center px-3 py-2 border-b border-border/50 sticky top-0 bg-popover z-10">
                <button type="button" onClick={() => setView('main')} className="mr-2 hover:bg-muted p-1 rounded-sm">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-xs">Background color</span>
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
                {COLORS.map((c) => (
                    <button
                        key={c.label}
                        type="button"
                        onClick={() => handleAction(() => {
                            if (type === 'col') setColumnBackgroundColor(editor, index, pos, c.value);
                            else if (type === 'row') setRowBackgroundColor(editor, index, pos, c.value);
                            else {
                                // If standard selection (not full row/col handle), set cell color for selected cells
                                editor.chain().focus().setCellAttribute('backgroundColor', c.value).run();
                            }
                        })}
                        className="w-full text-left px-2 py-1.5 hover:bg-muted/80 rounded-sm transition-colors flex items-center gap-2 group mb-0.5"
                    >
                        <div className={`w-5 h-5 rounded-sm flex items-center justify-center border border-border/20 ${c.class}`}>
                            <span className="text-[10px] uppercase font-bold text-center leading-none">A</span>
                        </div>
                        <span>{c.label}</span>
                    </button>
                ))}
            </div>
        </>
    );

    const renderAlignmentView = () => (
        <>
            <div className="flex items-center px-3 py-2 border-b border-border/50 sticky top-0 bg-popover z-10">
                <button type="button" onClick={() => setView('main')} className="mr-2 hover:bg-muted p-1 rounded-sm">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-xs">Alignment</span>
            </div>
            <div className="p-1">
                {renderMenuItem(<AlignLeft className="w-3.5 h-3.5" />, "Align left", () => handleAction(() => {
                    if (type === 'col') setColumnAlignment(editor, index, pos, 'left');
                    else editor.chain().focus().setTextAlign('left').run();
                }))}
                {renderMenuItem(<AlignCenter className="w-3.5 h-3.5" />, "Align center", () => handleAction(() => {
                    if (type === 'col') setColumnAlignment(editor, index, pos, 'center');
                    else editor.chain().focus().setTextAlign('center').run();
                }))}
                {renderMenuItem(<AlignRight className="w-3.5 h-3.5" />, "Align right", () => handleAction(() => {
                    if (type === 'col') setColumnAlignment(editor, index, pos, 'right');
                    else editor.chain().focus().setTextAlign('right').run();
                }))}

                {/* 
                  Note: Vertical alignment is usually applicable on the cell level using vertical-align CSS.
                  However, standard ProseMirror 'textAlign' only affects paragraphs/blocks.
                  For vertical alignment of columns, we would add 'verticalAlign' support to the Cell attributes.
                */}
            </div>
        </>
    );

    return createPortal(
        <div
            className="table-context-menu absolute z-[100] flex flex-col bg-popover/95 backdrop-blur-md border border-border shadow-2xl rounded-xl overflow-hidden text-foreground w-64 text-sm"
            style={{ top: position.top, left: position.left }}
            onMouseLeave={() => {
                // Return to main menu if they mouse off completely, optional
                // setView('main');
            }}
        >
            <div className="py-1">
                {view === 'main' && renderMainView()}
                {view === 'color' && renderColorView()}
                {view === 'alignment' && renderAlignmentView()}
            </div>
        </div>,
        document.body
    );
};
