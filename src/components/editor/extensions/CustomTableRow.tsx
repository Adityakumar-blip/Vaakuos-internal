import { TableRow as TiptapTableRow } from '@tiptap/extension-table-row';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import React from 'react';

// We create a React component for the row view that includes a drag handle
const TableRowView = ({ node, getPos, editor }: NodeViewProps) => {
    return (
        <NodeViewWrapper as="tr">
            {/* The drag handle column */}
            <td className="w-5 p-0 align-middle border-r border-border/50 bg-muted/20 relative group select-none" contentEditable={false}>
                <div
                    className="absolute inset-x-0 inset-y-0 cursor-grab flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-muted/40"
                    contentEditable={false}
                    data-drag-handle
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground"
                    >
                        <circle cx="9" cy="12" r="1" />
                        <circle cx="9" cy="5" r="1" />
                        <circle cx="9" cy="19" r="1" />
                        <circle cx="15" cy="12" r="1" />
                        <circle cx="15" cy="5" r="1" />
                        <circle cx="15" cy="19" r="1" />
                    </svg>
                </div>
            </td>
            {/* The actual row content */}
            <NodeViewContent as="div" className="table-row-content contents" />
        </NodeViewWrapper>
    );
};

export const CustomTableRow = TiptapTableRow.extend({
    addNodeView() {
        return ReactNodeViewRenderer(TableRowView);
    },
});
