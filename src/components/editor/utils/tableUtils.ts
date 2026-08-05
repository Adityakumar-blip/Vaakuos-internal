import { Editor } from '@tiptap/react';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { CellSelection } from 'prosemirror-tables';

/**
 * Helper to retrieve the active table node and its absolute position
 */
export const getTableNodeAndPos = (editor: Editor, pos: number) => {
  const $pos = editor.state.doc.resolve(pos);
  for (let i = $pos.depth; i > 0; i--) {
    const node = $pos.node(i);
    if (node.type.name === 'table') {
      return { node, pos: $pos.before(i) };
    }
  }
  return null;
};

export const clearColumn = (editor: Editor, colIndex: number, cellPos: number) => {
  const tableData = getTableNodeAndPos(editor, cellPos + 1);
  if (!tableData) return;
  const { node: tableNode, pos: tablePos } = tableData;
  const tr = editor.state.tr;

  tableNode.forEach((rowNode, rowOffset) => {
    let cIdx = 0;
    rowNode.forEach((cellNode, cellOffset) => {
      if (cIdx === colIndex) {
         const cellStart = tablePos + 1 + rowOffset + 1 + cellOffset + 1;
         const cellContentSize = cellNode.nodeSize - 2;
         const emptyParagraph = editor.schema.nodes.paragraph.create();
         tr.replaceWith(cellStart, cellStart + cellContentSize, emptyParagraph);
      }
      cIdx += cellNode.attrs.colspan || 1;
    });
  });
  
  editor.view.dispatch(tr);
};

export const clearRow = (editor: Editor, rowIndex: number, rowPos: number) => {
  const rowNode = editor.state.doc.nodeAt(rowPos);
  if (!rowNode || rowNode.type.name !== 'tableRow') return;
  
  const tr = editor.state.tr;
  rowNode.forEach((cellNode, cellOffset) => {
      const cellStart = rowPos + 1 + cellOffset + 1;
      const cellContentSize = cellNode.nodeSize - 2;
      const emptyParagraph = editor.schema.nodes.paragraph.create();
      tr.replaceWith(cellStart, cellStart + cellContentSize, emptyParagraph);
  });
  editor.view.dispatch(tr);
};

export const duplicateColumn = (editor: Editor, colIndex: number, cellPos: number) => {
  editor.chain().setTextSelection(cellPos + 1).addColumnAfter().run();
  
  const tableData = getTableNodeAndPos(editor, cellPos + 1);
  if (!tableData) return;
  const { node: tableNode, pos: tablePos } = tableData;
  const tr = editor.state.tr;

  tableNode.forEach((rowNode, rowOffset) => {
    let cIdx = 0;
    let sourceContent = null;
    let targetCellStart = -1;
    let targetCellContentSize = 0;
    
    rowNode.forEach((cellNode, cellOffset) => {
      if (cIdx === colIndex) {
         sourceContent = cellNode.content; 
      } else if (cIdx === colIndex + 1) {
         targetCellStart = tablePos + 1 + rowOffset + 1 + cellOffset + 1;
         targetCellContentSize = cellNode.nodeSize - 2;
      }
      cIdx += cellNode.attrs.colspan || 1;
    });
    
    if (sourceContent && targetCellStart !== -1) {
       tr.replaceWith(targetCellStart, targetCellStart + targetCellContentSize, sourceContent);
    }
  });

  editor.view.dispatch(tr);
};

export const duplicateRow = (editor: Editor, rowIndex: number, rowPos: number) => {
  editor.chain().setTextSelection(rowPos + 2).addRowAfter().run();
  
  const tableData = getTableNodeAndPos(editor, rowPos + 2);
  if (!tableData) return;
  const { node: tableNode, pos: tablePos } = tableData;
  const tr = editor.state.tr;

  let rIdx = 0;
  let sourceRowNode: ProseMirrorNode | null = null;
  let targetRowStart = -1;
  tableNode.forEach((rowNode, rowOffset) => {
     if (rIdx === rowIndex) {
       sourceRowNode = rowNode;
     } else if (rIdx === rowIndex + 1) {
       targetRowStart = tablePos + 1 + rowOffset;
     }
     rIdx++;
  });
  
  if (sourceRowNode && targetRowStart !== -1) {
     const targetRowNode = editor.state.doc.nodeAt(targetRowStart);
     if (targetRowNode) {
       tr.replaceWith(targetRowStart + 1, targetRowStart + 1 + targetRowNode.nodeSize - 2, sourceRowNode.content);
     }
  }
  editor.view.dispatch(tr);
};

export const moveColumn = (editor: Editor, colIndex: number, cellPos: number, direction: 'left'|'right') => {
  if (direction === 'left' && colIndex === 0) return;
  const targetColIndex = direction === 'left' ? colIndex - 1 : colIndex + 1;
  reorderColumn(editor, colIndex, cellPos, targetColIndex);
};

export const moveRow = (editor: Editor, rowIndex: number, rowPos: number, direction: 'up'|'down') => {
  if (direction === 'up' && rowIndex <= 1) return; // Protect header row from moving row 1 up
  if (direction === 'up' && rowIndex === 0) return; 
  const targetRowIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
  reorderRow(editor, rowIndex, rowPos, targetRowIndex);
};

export const reorderColumn = (editor: Editor, sourceColIndex: number, cellPos: number, targetColIndex: number) => {
  if (sourceColIndex === targetColIndex) return;
  const tableData = getTableNodeAndPos(editor, cellPos + 1);
  if (!tableData) return;
  const { node: tableNode, pos: tablePos } = tableData;
  
  let maxCol = 0;
  tableNode.child(0)?.forEach((c) => { maxCol += c.attrs.colspan || 1; });
  if (targetColIndex < 0 || targetColIndex >= maxCol) return;

  const tr = editor.state.tr;
  const newRowNodes: ProseMirrorNode[] = [];
  
  tableNode.forEach((rowNode) => {
     const cells: ProseMirrorNode[] = [];
     rowNode.forEach((cellNode) => { cells.push(cellNode); });
     
     const [movedCell] = cells.splice(sourceColIndex, 1);
     cells.splice(targetColIndex, 0, movedCell);
     
     newRowNodes.push(editor.schema.nodes.tableRow.create(null, cells));
  });
  
  const firstRowStart = tablePos + 1;
  const lastRowEnd = tablePos + tableNode.nodeSize - 1;
  tr.replaceWith(firstRowStart, lastRowEnd, newRowNodes);
  editor.view.dispatch(tr);
};

export const reorderRow = (editor: Editor, sourceRowIndex: number, rowPos: number, targetRowIndex: number) => {
  if (sourceRowIndex === targetRowIndex) return;
  
  if (sourceRowIndex === 0 || targetRowIndex === 0) return;
  
  const tableData = getTableNodeAndPos(editor, rowPos + 2);
  if (!tableData) return;
  const { node: tableNode, pos: tablePos } = tableData;
  if (targetRowIndex < 0 || targetRowIndex >= tableNode.childCount) return;

  const tr = editor.state.tr;
  const rows: ProseMirrorNode[] = [];
  tableNode.forEach((rowNode) => { rows.push(rowNode); });
  
  const [movedRow] = rows.splice(sourceRowIndex, 1);
  rows.splice(targetRowIndex, 0, movedRow);
  
  const firstRowStart = tablePos + 1;
  const lastRowEnd = tablePos + tableNode.nodeSize - 1;
  tr.replaceWith(firstRowStart, lastRowEnd, rows);
  editor.view.dispatch(tr);
};

import { Fragment } from 'prosemirror-model';

export const sortColumn = (editor: Editor, colIndex: number, cellPos: number, order: 'asc'|'desc' = 'asc') => {
  const tableData = getTableNodeAndPos(editor, cellPos + 1);
  if (!tableData) return;
  const { node: tableNode, pos: tablePos } = tableData;
  
  const rows: { content: Fragment, sortKey: string, startPos: number, size: number }[] = [];
  let rIdx = 0;
  tableNode.forEach((rowNode, rowOffset) => {
     if (rIdx === 0) { rIdx++; return; } 
     
     let sortKey = '';
     let cIdx = 0;
     rowNode.forEach((cellNode) => {
        if (cIdx === colIndex) {
           sortKey = cellNode.textContent.trim().toLowerCase();
        }
        cIdx += cellNode.attrs.colspan || 1;
     });
     
     rows.push({
        content: rowNode.content,
        sortKey,
        startPos: tablePos + 1 + rowOffset,
        size: rowNode.nodeSize
     });
     rIdx++;
  });
  
  if (rows.length === 0) return;
  
  rows.sort((a, b) => {
     const valA = parseFloat(a.sortKey);
     const valB = parseFloat(b.sortKey);
     let cmp = 0;
     if (!isNaN(valA) && !isNaN(valB)) {
        cmp = valA - valB;
     } else {
        cmp = a.sortKey.localeCompare(b.sortKey);
     }
     return order === 'asc' ? cmp : -cmp;
  });
  
  const tr = editor.state.tr;
  const firstRowStart = rows[0].startPos;
  const lastRow = rows[rows.length - 1];
  
  // Notice we must compute the total span of the rows. 
  // Because node sizes remain exactly identical when we just reorder them, 
  // we can safely just delete the entire block and insert the re-ordered ones!
  let lastRowEnd = 0;
  rows.forEach(r => {
      if (r.startPos + r.size > lastRowEnd) {
          lastRowEnd = r.startPos + r.size;
      }
  });

  tr.delete(firstRowStart, lastRowEnd);
  const sortedRowNodes = rows.map(r => editor.schema.nodes.tableRow.create(null, r.content));
  tr.insert(firstRowStart, sortedRowNodes);
  
  editor.view.dispatch(tr);
};

export const setColumnAlignment = (editor: Editor, colIndex: number, cellPos: number, alignment: 'left'|'center'|'right') => {
  const tableData = getTableNodeAndPos(editor, cellPos + 1);
  if (!tableData) return;
  const { node: tableNode, pos: tablePos } = tableData;
  const tr = editor.state.tr;
  
  tableNode.forEach((rowNode, rowOffset) => {
     let cIdx = 0;
     rowNode.forEach((cellNode, cellOffset) => {
         if (cIdx === colIndex) {
            const cellStart = tablePos + 1 + rowOffset + 1 + cellOffset + 1;
            cellNode.forEach((blockNode, blockOffset) => {
               if (blockNode.type.name === 'paragraph' || blockNode.type.name === 'heading') {
                  const blockPos = cellStart + blockOffset;
                  tr.setNodeMarkup(blockPos, null, { ...blockNode.attrs, textAlign: alignment });
               }
            });
         }
         cIdx += cellNode.attrs.colspan || 1;
     });
  });
  editor.view.dispatch(tr);
};

export const setColumnBackgroundColor = (editor: Editor, colIndex: number, cellPos: number, color: string | null) => {
  const tableData = getTableNodeAndPos(editor, cellPos + 1);
  if (!tableData) return;
  const { node: tableNode, pos: tablePos } = tableData;
  const tr = editor.state.tr;
  
  tableNode.forEach((rowNode, rowOffset) => {
     let cIdx = 0;
     rowNode.forEach((cellNode, cellOffset) => {
         if (cIdx === colIndex) {
            const cellStart = tablePos + 1 + rowOffset + 1 + cellOffset;
            tr.setNodeMarkup(cellStart, null, { ...cellNode.attrs, backgroundColor: color });
         }
         cIdx += cellNode.attrs.colspan || 1;
     });
  });
  editor.view.dispatch(tr);
};

export const setRowBackgroundColor = (editor: Editor, rowIndex: number, rowPos: number, color: string | null) => {
  const tableData = getTableNodeAndPos(editor, rowPos + 2);
  if (!tableData) return;
  const { node: tableNode, pos: tablePos } = tableData;
  const tr = editor.state.tr;
  
  let rIdx = 0;
  tableNode.forEach((rowNode, rowOffset) => {
     if (rIdx === rowIndex) {
         rowNode.forEach((cellNode, cellOffset) => {
            const cellStart = tablePos + 1 + rowOffset + 1 + cellOffset;
            tr.setNodeMarkup(cellStart, null, { ...cellNode.attrs, backgroundColor: color });
         });
     }
     rIdx++;
  });
  editor.view.dispatch(tr);
};

export const selectColumnCells = (editor: Editor, colIndex: number, cellPos: number) => {
  const tableData = getTableNodeAndPos(editor, cellPos + 1);
  if (!tableData) return;
  const { node: tableNode, pos: tablePos } = tableData;
  
  let firstCellStart = -1;
  let lastCellStart = -1;
  
  tableNode.forEach((rowNode, rowOffset) => {
     let cIdx = 0;
     rowNode.forEach((cellNode, cellOffset) => {
         if (cIdx === colIndex) {
            const cellStart = tablePos + 1 + rowOffset + 1 + cellOffset;
            if (firstCellStart === -1) firstCellStart = cellStart;
            lastCellStart = cellStart;
         }
         cIdx += cellNode.attrs.colspan || 1;
     });
  });
  
  if (firstCellStart !== -1 && lastCellStart !== -1) {
     const selection = CellSelection.create(editor.state.doc, firstCellStart, lastCellStart);
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     editor.view.dispatch(editor.state.tr.setSelection(selection as any));
  }
};

export const selectRowCells = (editor: Editor, rowIndex: number, rowPos: number) => {
  const tableData = getTableNodeAndPos(editor, rowPos + 2);
  if (!tableData) return;
  const { node: tableNode, pos: tablePos } = tableData;
  
  let firstCellStart = -1;
  let lastCellStart = -1;
  
  let rIdx = 0;
  tableNode.forEach((rowNode, rowOffset) => {
     if (rIdx === rowIndex) {
         rowNode.forEach((cellNode, cellOffset) => {
            const cellStart = tablePos + 1 + rowOffset + 1 + cellOffset;
            if (firstCellStart === -1) firstCellStart = cellStart;
            lastCellStart = cellStart;
         });
     }
     rIdx++;
  });
  
  if (firstCellStart !== -1 && lastCellStart !== -1) {
     const selection = CellSelection.create(editor.state.doc, firstCellStart, lastCellStart);
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     editor.view.dispatch(editor.state.tr.setSelection(selection as any));
  }
};
