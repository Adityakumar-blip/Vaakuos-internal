import { Extension, Editor } from '@tiptap/core';
import { Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { reorderColumn, reorderRow } from '../utils/tableUtils';

/**
 * A Prosemirror plugin that adds row and column handles (decorations) to the active table.
 * We render small DOM elements on the left of each row and the top of each column.
 * Clicking on them triggers a React context menu.
 */

export const TableGripsPluginKey = new PluginKey('tableGrips');

export const TableGrips = Extension.create({
    name: 'tableGrips',

    addProseMirrorPlugins() {
        const editor = this.editor;
        return [
            new Plugin({
                key: TableGripsPluginKey,
                state: {
                    init() {
                        return DecorationSet.empty;
                    },
                    apply(tr, oldState) {
                        return updateDecorations(tr, editor);
                    }
                },
                props: {
                    decorations(state) {
                        return this.getState(state);
                    },
                    handleDrop(view, event, slice, moved) {
                        try {
                            const dataStr = event.dataTransfer?.getData('text/plain');
                            if (!dataStr) return false;
                            
                            const data = JSON.parse(dataStr);
                            if (data.type === 'row' || data.type === 'col') {
                                event.preventDefault();

                                const target = event.target as HTMLElement;
                                const td = target.closest('td, th') as HTMLTableCellElement | null;
                                if (!td) return true;
                                
                                const tr = td.closest('tr') as HTMLTableRowElement | null;
                                if (!tr) return true;

                                // Calculate col index
                                let targetColIndex = 0;
                                let sibling = td.previousElementSibling;
                                while (sibling) {
                                    targetColIndex++;
                                    sibling = sibling.previousElementSibling;
                                }

                                const table = tr.closest('table');
                                if (!table) return true;

                                // Calculate row index
                                const allTrs = Array.from(table.querySelectorAll('tr'));
                                const targetRowIndex = allTrs.indexOf(tr);

                                if (data.type === 'row') {
                                    reorderRow(editor, data.index, data.pos, targetRowIndex);
                                } else if (data.type === 'col') {
                                    reorderColumn(editor, data.index, data.pos, targetColIndex);
                                }
                                
                                return true;
                            }
                        } catch (e) {
                            // ignore
                        }
                        return false;
                    }
                },
                view(editorView) {
                    const handleMouseOver = (e: MouseEvent) => {
                        const target = e.target as HTMLElement;
                        
                        // If hovering directly over a handle, keep it hovered
                        if (target.closest('.table-row-handle') || target.closest('.table-col-handle')) {
                            target.closest('.table-row-handle, .table-col-handle')?.classList.add('hovered');
                            return;
                        }

                        // Clear all hovered states
                        const allHandles = editorView.dom.querySelectorAll('.table-row-handle, .table-col-handle');
                        allHandles.forEach(h => h.classList.remove('hovered'));

                        const td = target.closest('td, th') as HTMLTableCellElement | null;
                        if (!td) return;
                        
                        const tr = td.closest('tr') as HTMLTableRowElement | null;
                        if (!tr) return;

                        const table = tr.closest('table');
                        if (!table) return;

                        // Calculate col index by counting previous siblings (ignoring non-elements)
                        let colIndex = 0;
                        let sibling = td.previousElementSibling;
                        while (sibling) {
                            colIndex++;
                            sibling = sibling.previousElementSibling;
                        }

                        // Calculate row index
                        const allTrs = Array.from(table.querySelectorAll('tr'));
                        const rowIndex = allTrs.indexOf(tr);

                        // Find handle elements inside the table and add 'hovered' class
                        const rowHandle = table.querySelector(`.table-row-handle[data-row-index="${rowIndex}"]`);
                        if (rowHandle) rowHandle.classList.add('hovered');

                        const colHandle = table.querySelector(`.table-col-handle[data-col-index="${colIndex}"]`);
                        if (colHandle) colHandle.classList.add('hovered');
                    };

                    editorView.dom.addEventListener('mouseover', handleMouseOver);
                    
                    return {
                        destroy() {
                            editorView.dom.removeEventListener('mouseover', handleMouseOver);
                        }
                    };
                }
            })
        ];
    },
});

function updateDecorations(tr: Transaction, editor: Editor): DecorationSet {
    const doc = tr.doc;
    const decorations: Decoration[] = [];
    
    // Track active rows and columns for handle highlighting based on selection
    const activeRowIndices = new Map<number, Set<number>>();
    const activeColIndices = new Map<number, Set<number>>();

    const { selection } = tr;
    if (selection) {
        doc.nodesBetween(selection.from, selection.to, (node: ProseMirrorNode, pos: number) => {
            if (node.type.name === 'table') {
                const rSet = new Set<number>();
                const cSet = new Set<number>();
                activeRowIndices.set(pos, rSet);
                activeColIndices.set(pos, cSet);
                
                let rIndex = 0;
                node.forEach((rowNode: ProseMirrorNode, rowOffset: number) => {
                    if (rowNode.type.name !== 'tableRow') return;
                    const rowPos = pos + 1 + rowOffset;
                    let cIndex = 0;
                    
                    rowNode.forEach((cellNode: ProseMirrorNode, cellOffset: number) => {
                        const cellPos = rowPos + 1 + cellOffset;
                        const cellEnd = cellPos + cellNode.nodeSize;
                        
                        let isCellActive = false;
                        for (let i = 0; i < selection.ranges.length; i++) {
                            const range = selection.ranges[i];
                            if (Math.max(cellPos, range.$from.pos) < Math.min(cellEnd, range.$to.pos)) {
                                isCellActive = true;
                                break;
                            }
                        }
                        if (!isCellActive && selection.empty && selection.from >= cellPos && selection.from <= cellEnd) {
                            isCellActive = true;
                        }
                        
                        if (isCellActive) {
                            rSet.add(rIndex);
                            for (let i = 0; i < (cellNode.attrs.colspan || 1); i++) {
                                cSet.add(cIndex + i);
                            }
                        }
                        cIndex += cellNode.attrs.colspan || 1;
                    });
                    rIndex++;
                });
                return false;
            }
        });
    }

    doc.descendants((tableNode: ProseMirrorNode, tablePos: number) => {
        if (tableNode.type.name !== 'table') return true;

        const rSet = activeRowIndices.get(tablePos) || new Set<number>();
        const cSet = activeColIndices.get(tablePos) || new Set<number>();

        let rowIndex = 0;
        tableNode.forEach((rowNode: ProseMirrorNode, rowOffset: number) => {
            if (rowNode.type.name !== 'tableRow') return;

            const rowPos = tablePos + 1 + rowOffset;
            const currentRowIndex = rowIndex; // Capture by value for closure!
            let firstCellPos = -1;

            rowNode.forEach((cellNode: ProseMirrorNode, cellOffset: number) => {
                if (firstCellPos === -1 && (cellNode.type.name === 'tableCell' || cellNode.type.name === 'tableHeader')) {
                    firstCellPos = rowPos + 1 + cellOffset;
                }
            });

            if (firstCellPos !== -1) {
                decorations.push(
                    Decoration.widget(firstCellPos + 1, () => {
                        const handle = document.createElement('div');
                        const isActive = rSet.has(currentRowIndex);
                        handle.className = `table-row-handle flex items-center justify-center cursor-grab hover:bg-muted/50 transition-colors rounded-sm ${isActive ? 'active' : ''}`;
                        handle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>`;
                        handle.dataset.rowIndex = currentRowIndex.toString();
                        handle.dataset.rowPos = rowPos.toString();
                        
                        handle.draggable = true;
                        handle.addEventListener('dragstart', (e) => {
                            e.stopPropagation();
                            if (e.dataTransfer) {
                                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'row', index: currentRowIndex, pos: rowPos }));
                                e.dataTransfer.effectAllowed = 'move';
                            }
                        });
                        handle.addEventListener('dragover', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
                            handle.classList.add('bg-primary/20');
                        });
                        handle.addEventListener('dragleave', (e) => { 
                            e.stopPropagation();
                            handle.classList.remove('bg-primary/20'); 
                        });
                        handle.addEventListener('drop', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handle.classList.remove('bg-primary/20');
                            try {
                                const data = JSON.parse(e.dataTransfer?.getData('text/plain') || '{}');
                                if (data.type === 'row') {
                                    reorderRow(editor, data.index, data.pos, currentRowIndex);
                                }
                            } catch (err) { console.error('Row drag error:', err); }
                        });

                        return handle;
                    }, { side: -1 })
                );
            }

            if (currentRowIndex === 0) {
                let colIndex = 0;
                rowNode.forEach((cellNode: ProseMirrorNode, cellOffset: number) => {
                    const cellPos = rowPos + 1 + cellOffset;
                    const currentColIndex = colIndex;
                    
                    decorations.push(
                        Decoration.widget(cellPos + 1, () => {
                            const handle = document.createElement('div');
                            const isActive = cSet.has(currentColIndex);
                            handle.className = `table-col-handle flex items-center justify-center cursor-grab hover:bg-muted/50 transition-colors rounded-sm ${isActive ? 'active' : ''}`;
                            handle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><circle cx="12" cy="9" r="1"/><circle cx="5" cy="9" r="1"/><circle cx="19" cy="9" r="1"/><circle cx="12" cy="15" r="1"/><circle cx="5" cy="15" r="1"/><circle cx="19" cy="15" r="1"/></svg>`;
                            handle.dataset.colIndex = currentColIndex.toString();
                            handle.dataset.cellPos = cellPos.toString();

                            handle.draggable = true;
                            handle.addEventListener('dragstart', (e) => {
                                e.stopPropagation();
                                if (e.dataTransfer) {
                                    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'col', index: currentColIndex, pos: cellPos }));
                                    e.dataTransfer.effectAllowed = 'move';
                                }
                            });
                            handle.addEventListener('dragover', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
                                handle.classList.add('bg-primary/20');
                            });
                            handle.addEventListener('dragleave', (e) => { 
                                e.stopPropagation();
                                handle.classList.remove('bg-primary/20'); 
                            });
                            handle.addEventListener('drop', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handle.classList.remove('bg-primary/20');
                                try {
                                    const data = JSON.parse(e.dataTransfer?.getData('text/plain') || '{}');
                                    if (data.type === 'col') {
                                        reorderColumn(editor, data.index, data.pos, currentColIndex);
                                    }
                                } catch (err) { console.error('Col drag error:', err); }
                            });

                            return handle;
                        }, { side: -1 })
                    );
                    
                    colIndex += cellNode.attrs.colspan || 1;
                });
            }
            rowIndex++;
        });

        return false; // Skip the table's children
    });

    return DecorationSet.create(doc, decorations);
}
