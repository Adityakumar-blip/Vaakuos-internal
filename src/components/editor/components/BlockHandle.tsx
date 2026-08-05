import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Plus, GripVertical } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import { BlockContextMenu } from './BlockContextMenu';
import { SlashCommandPluginKey } from '../extensions/SlashCommand';

interface BlockHandleProps {
    editor: Editor | null;
}

/**
 * Resolve the nearest top-level (depth-1) block position for a given
 * document position. Skips wrapper nodes like lists / blockquotes so we
 * always target the inner "real" block (paragraph, heading, listItem …).
 */
function resolveTopBlock(editor: Editor, docPos: number): number | null {
    try {
        const resolved = editor.state.doc.resolve(docPos);
        if (resolved.depth < 1) return null;

        let targetDepth = 1;
        for (let i = 1; i <= resolved.depth; i++) {
            const node = resolved.node(i);
            if (['bulletList', 'orderedList', 'taskList', 'blockquote'].includes(node.type.name)) {
                continue;
            }
            if (node.type.name === 'table') {
                targetDepth = i;
                break;
            }
            if (node.isBlock) {
                targetDepth = i;
            }
        }

        return resolved.before(targetDepth);
    } catch {
        return null;
    }
}

export const BlockHandle: React.FC<BlockHandleProps> = memo(({ editor }) => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0 });
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ top: 0, left: 0 });
    const [currentNodePos, setCurrentNodePos] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragState = useRef<{
        isDragging: boolean;
        dragNode: HTMLElement | null;
        sourcePos: number | null;
        indicator: HTMLElement | null;
    }>({ isDragging: false, dragNode: null, sourcePos: null, indicator: null });

    useEffect(() => {
        if (!editor || editor.isDestroyed) return;

        let editorContainer: HTMLElement | null = null;
        let editorDom: HTMLElement | null = null;
        let checkInterval: NodeJS.Timeout;

        const handleMouseMove = (e: MouseEvent) => {
            // Don't update while dragging or context menu is open
            if (dragState.current.isDragging) return;
            if (editor.isDestroyed || !editorDom || !editorContainer) return;

            const editorRect = editorDom.getBoundingClientRect();
            const containerRect = editorContainer.getBoundingClientRect();

            // Check if mouse is in the editor area (extend left boundary to catch gutter)
            if (
                e.clientX < containerRect.left - 20 ||
                e.clientX > containerRect.right + 20 ||
                e.clientY < editorRect.top - 20 ||
                e.clientY > editorRect.bottom + 20
            ) {
                if (!showContextMenu) setVisible(false);
                return;
            }

            // Build coordinates that land safely inside the editor text area.
            // posAtCoords can fail if the x-coordinate is in the gutter, so
            // clamp it reliably inside the 56px padding.
            const safeX = Math.max(
                editorRect.left + 64,
                Math.min(e.clientX, editorRect.right - 64)
            );

            try {
                const pos = editor.view.posAtCoords({ left: safeX, top: e.clientY });
                if (!pos) {
                    if (!showContextMenu) setVisible(false);
                    return;
                }

                const topLevelPos = resolveTopBlock(editor, pos.pos);
                if (topLevelPos === null) {
                    if (!showContextMenu) setVisible(false);
                    return;
                }

                const dom = editor.view.nodeDOM(topLevelPos);
                if (!dom || !(dom instanceof HTMLElement)) {
                    if (!showContextMenu) setVisible(false);
                    return;
                }

                // If the top level block is a table, hide the block handle
                // because tables have their own dedicated table grips.
                const node = editor.state.doc.nodeAt(topLevelPos);
                if (node?.type.name === 'table') {
                    if (!showContextMenu) setVisible(false);
                    return;
                }

                const blockRect = dom.getBoundingClientRect();
                // Account for scroll offset inside the container
                const offsetTop = blockRect.top - containerRect.top + editorContainer.scrollTop;

                setPosition({ top: offsetTop + 2 });
                setCurrentNodePos(topLevelPos);
                setVisible(true);
            } catch {
                if (!showContextMenu) setVisible(false);
            }
        };

        const handleMouseLeave = () => {
            if (!showContextMenu && !dragState.current.isDragging) {
                setVisible(false);
            }
        };

        const tryAttach = () => {
            if (editor.isDestroyed) {
                clearInterval(checkInterval);
                return;
            }
            try {
                editorDom = editor.view.dom;
                editorContainer = editorDom.closest('.notion-editor') as HTMLElement | null;
                if (editorContainer) {
                    editorContainer.addEventListener('mousemove', handleMouseMove);
                    editorContainer.addEventListener('mouseleave', handleMouseLeave);
                    clearInterval(checkInterval);
                }
            } catch (err) {
                // not mounted yet, will try again
            }
        };

        checkInterval = setInterval(tryAttach, 50);
        tryAttach();

        return () => {
            clearInterval(checkInterval);
            if (editorContainer) {
                editorContainer.removeEventListener('mousemove', handleMouseMove);
                editorContainer.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, [editor, showContextMenu]);

    // --- Insert block (click +) ---
    const handleInsertClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!editor || currentNodePos === null) return;

        try {
            const node = editor.state.doc.nodeAt(currentNodePos);
            if (!node) return;

            const endPos = currentNodePos + node.nodeSize;

            // Insert an empty paragraph after the current block
            editor.chain().focus().insertContentAt(endPos, { type: 'paragraph' }).run();

            // Set cursor in the new paragraph and trigger slash menu
            requestAnimationFrame(() => {
                try {
                    const newPos = endPos + 1;
                    editor.chain().setTextSelection(newPos).run();

                    editor.view.dispatch(
                        editor.state.tr
                            .insertText('/', newPos, newPos)
                            .setMeta(SlashCommandPluginKey, {
                                active: true,
                                range: { from: newPos, to: newPos + 1 },
                                query: '',
                            })
                    );
                } catch {
                    // If slash trigger fails, at least the paragraph is inserted
                }
            });
        } catch {
            // Ignore errors gracefully
        }
    }, [editor, currentNodePos]);

    // --- Open context menu (click ⋮⋮) ---
    const handleDragHandleClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (!editor || currentNodePos === null) return;

            try {
                // Select the node
                const node = editor.state.doc.nodeAt(currentNodePos);
                if (node) {
                    editor
                        .chain()
                        .setTextSelection({
                            from: currentNodePos,
                            to: currentNodePos + node.nodeSize,
                        })
                        .run();
                }
            } catch {
                // Ignore
            }

            const handleRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setShowContextMenu(true);
            setContextMenuPos({
                top: handleRect.top,
                left: handleRect.right + 4,
            });
        },
        [editor, currentNodePos]
    );

    // --- Drag and drop ---
    const handleDragStart = useCallback(
        (e: React.MouseEvent) => {
            if (!editor || currentNodePos === null) return;

            const editorDom = editor.view.dom;
            const editorContainer = editorDom.closest('.notion-editor') as HTMLElement | null;
            if (!editorContainer) return;

            const node = editor.state.doc.nodeAt(currentNodePos);
            if (!node) return;

            // Select the node visually
            try {
                const tr = editor.state.tr.setSelection(
                    NodeSelection.create(editor.state.doc, currentNodePos)
                );
                editor.view.dispatch(tr);
            } catch {
                return;
            }

            const blockDom = editor.view.nodeDOM(currentNodePos) as HTMLElement | null;
            if (!blockDom) return;

            blockDom.classList.add('block-dragging');

            // Create drop indicator
            const indicator = document.createElement('div');
            indicator.className = 'block-drop-indicator';
            editorContainer.appendChild(indicator);

            const state = {
                isDragging: true,
                dragNode: blockDom,
                sourcePos: currentNodePos,
                indicator,
            };
            dragState.current = state;

            const containerRect = editorContainer.getBoundingClientRect();
            const editorRect = editorDom.getBoundingClientRect();

            const onMouseMove = (moveEvent: MouseEvent) => {
                if (!state.isDragging) return;

                try {
                    const safeX = Math.max(
                        editorRect.left + 64,
                        Math.min(moveEvent.clientX, editorRect.right - 64)
                    );
                    const pos = editor.view.posAtCoords({
                        left: safeX,
                        top: moveEvent.clientY,
                    });
                    if (!pos) return;

                    const targetPos = resolveTopBlock(editor, pos.pos);
                    if (targetPos === null) return;

                    const targetDom = editor.view.nodeDOM(targetPos) as HTMLElement | null;
                    if (!targetDom) return;

                    const targetRect = targetDom.getBoundingClientRect();
                    const midY = targetRect.top + targetRect.height / 2;
                    const insertAfter = moveEvent.clientY > midY;

                    const lineY = insertAfter
                        ? targetRect.bottom - containerRect.top + editorContainer.scrollTop
                        : targetRect.top - containerRect.top + editorContainer.scrollTop;

                    indicator.style.top = `${lineY}px`;
                    indicator.style.display = 'block';
                } catch {
                    // Ignore
                }
            };

            const onMouseUp = (upEvent: MouseEvent) => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);

                blockDom.classList.remove('block-dragging');
                indicator.remove();
                state.isDragging = false;
                dragState.current = { isDragging: false, dragNode: null, sourcePos: null, indicator: null };

                if (state.sourcePos === null) return;

                try {
                    const safeX = Math.max(
                        editorRect.left + 64,
                        Math.min(upEvent.clientX, editorRect.right - 64)
                    );
                    const pos = editor.view.posAtCoords({
                        left: safeX,
                        top: upEvent.clientY,
                    });
                    if (!pos) return;

                    const targetPos = resolveTopBlock(editor, pos.pos);
                    if (targetPos === null || targetPos === state.sourcePos) return;

                    const targetDom = editor.view.nodeDOM(targetPos) as HTMLElement | null;
                    if (!targetDom) return;

                    const targetRect = targetDom.getBoundingClientRect();
                    const midY = targetRect.top + targetRect.height / 2;
                    const insertAfter = upEvent.clientY > midY;

                    const sourceNode = editor.state.doc.nodeAt(state.sourcePos);
                    if (!sourceNode) return;

                    const targetNode = editor.state.doc.nodeAt(targetPos);
                    if (!targetNode) return;

                    // Calculate insertion position
                    let insertPos = insertAfter ? targetPos + targetNode.nodeSize : targetPos;

                    // Adjust if source is before target (deletion shifts positions)
                    const sourceEnd = state.sourcePos + sourceNode.nodeSize;

                    const tr = editor.state.tr;

                    // Delete source first
                    tr.delete(state.sourcePos, sourceEnd);

                    // Adjust insert position after deletion
                    if (state.sourcePos < insertPos) {
                        insertPos -= sourceNode.nodeSize;
                    }

                    // Insert at new position
                    tr.insert(insertPos, sourceNode);
                    editor.view.dispatch(tr);
                } catch {
                    // Ignore failed drops
                }
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },
        [editor, currentNodePos]
    );

    if (!editor) return null;

    return (
        <>
            <div
                ref={containerRef}
                className={`block-handle-container ${visible ? 'visible' : ''}`}
                style={{ top: position.top }}
            >
                <button
                    type="button"
                    className="block-handle-btn"
                    onClick={handleInsertClick}
                    title="Insert block"
                >
                    <Plus size={14} />
                </button>
                <button
                    type="button"
                    className="block-handle-btn"
                    onClick={handleDragHandleClick}
                    onMouseDown={(e) => {
                        // Start drag on prolonged hold
                        const timer = setTimeout(() => handleDragStart(e), 200);
                        const cancel = () => {
                            clearTimeout(timer);
                            document.removeEventListener('mouseup', cancel);
                        };
                        document.addEventListener('mouseup', cancel);
                    }}
                    title="Click for options. Hold to drag."
                >
                    <GripVertical size={14} />
                </button>
            </div>

            {showContextMenu && editor && (
                <BlockContextMenu
                    editor={editor}
                    nodePos={currentNodePos}
                    position={contextMenuPos}
                    onClose={() => setShowContextMenu(false)}
                />
            )}
        </>
    );
});

BlockHandle.displayName = 'BlockHandle';
