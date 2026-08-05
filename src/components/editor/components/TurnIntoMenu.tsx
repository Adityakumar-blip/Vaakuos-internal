import React from 'react';
import { Editor } from '@tiptap/react';
import {
    Type,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    ListChecks,
    Quote,
    Code,
    Video,
    ListCollapse,
    Sigma
} from 'lucide-react';

interface TurnIntoMenuProps {
    editor: Editor;
    onClose: () => void;
}

const BLOCK_TYPES = [
    { id: 'paragraph', label: 'Text', icon: Type, iconLabel: 'T' },
    { id: 'heading1', label: 'Heading 1', icon: Heading1, iconLabel: 'H1' },
    { id: 'heading2', label: 'Heading 2', icon: Heading2, iconLabel: 'H2' },
    { id: 'heading3', label: 'Heading 3', icon: Heading3, iconLabel: 'H3' },
    { id: 'bulletList', label: 'Bulleted list', icon: List, iconLabel: null },
    { id: 'orderedList', label: 'Numbered list', icon: ListOrdered, iconLabel: null },
    { id: 'taskList', label: 'To-do list', icon: ListChecks, iconLabel: null },
    { id: 'blockquote', label: 'Blockquote', icon: Quote, iconLabel: null },
    { id: 'codeBlock', label: 'Code block', icon: Code, iconLabel: null },
    { id: 'toggle', label: 'Toggle list', icon: ListCollapse, iconLabel: null },
    { id: 'math', label: 'Math Equation', icon: Sigma, iconLabel: null },
    { id: 'youtube', label: 'YouTube Video', icon: Video, iconLabel: null },
];

function getCurrentBlockType(editor: Editor): string {
    if (editor.isActive('heading', { level: 1 })) return 'heading1';
    if (editor.isActive('heading', { level: 2 })) return 'heading2';
    if (editor.isActive('heading', { level: 3 })) return 'heading3';
    if (editor.isActive('bulletList')) return 'bulletList';
    if (editor.isActive('orderedList')) return 'orderedList';
    if (editor.isActive('taskList')) return 'taskList';
    if (editor.isActive('blockquote')) return 'blockquote';
    if (editor.isActive('codeBlock')) return 'codeBlock';
    if (editor.isActive('toggleBlock')) return 'toggle';
    if (editor.isActive('math')) return 'math';
    if (editor.isActive('youtube')) return 'youtube';
    return 'paragraph';
}

export function getBlockTypeLabel(editor: Editor): string {
    const type = getCurrentBlockType(editor);
    return BLOCK_TYPES.find((b) => b.id === type)?.label || 'Text';
}

export const TurnIntoMenu: React.FC<TurnIntoMenuProps> = ({ editor, onClose }) => {
    const currentType = getCurrentBlockType(editor);

    const turnInto = (blockType: string) => {
        const chain = editor.chain().focus();

        switch (blockType) {
            case 'paragraph':
                chain.clearNodes().run();
                break;
            case 'heading1':
                chain.clearNodes().setHeading({ level: 1 }).run();
                break;
            case 'heading2':
                chain.clearNodes().setHeading({ level: 2 }).run();
                break;
            case 'heading3':
                chain.clearNodes().setHeading({ level: 3 }).run();
                break;
            case 'bulletList':
                chain.clearNodes().toggleBulletList().run();
                break;
            case 'orderedList':
                chain.clearNodes().toggleOrderedList().run();
                break;
            case 'taskList':
                chain.clearNodes().toggleTaskList().run();
                break;
            case 'blockquote':
                chain.clearNodes().toggleBlockquote().run();
                break;
            case 'codeBlock':
                chain.clearNodes().toggleCodeBlock().run();
                break;
            case 'toggle':
                editor.chain().focus().setDetails().run();
                break;
            case 'math':
                editor.chain().focus().insertContent({ type: 'inlineMath' }).run();
                break;
            case 'youtube': {
                const url = window.prompt('Enter YouTube URL:');
                if (url) {
                    editor.commands.setYoutubeVideo({ src: url });
                }
                break;
            }
        }

        onClose();
    };

    return (
        <div className="editor-dropdown" onClick={(e) => e.stopPropagation()}>
            {BLOCK_TYPES.map((block) => {
                const Icon = block.icon;
                return (
                    <button type="button"
                        key={block.id}
                        className={`dropdown-item ${currentType === block.id ? 'active' : ''}`}
                        onClick={() => turnInto(block.id)}
                    >
                        <span className="dropdown-icon">
                            {block.iconLabel ? (
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{block.iconLabel}</span>
                            ) : (
                                <Icon size={16} />
                            )}
                        </span>
                        {block.label}
                    </button>
                );
            })}
        </div>
    );
};
