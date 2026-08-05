import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
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
    Image as ImageIcon,
    Minus,
    Table,
    AtSign,
    Smile,
    ListTree,
    Paperclip,
    Video,
    ListCollapse,
    Sigma,
    MapPin,
    Twitter,
} from 'lucide-react';
import { Editor } from '@tiptap/react';
import { SlashCommandPluginKey } from '../extensions/SlashCommand';

interface SlashItem {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    command: (editor: Editor) => void;
}

const SLASH_ITEMS: SlashItem[] = [
    {
        id: 'paragraph',
        label: 'Text',
        description: 'Plain text block',
        icon: <Type size={18} />,
        command: (editor) => editor.chain().focus().clearNodes().run(),
    },
    {
        id: 'heading1',
        label: 'Heading 1',
        description: 'Large heading',
        icon: <Heading1 size={18} />,
        command: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
    },
    {
        id: 'heading2',
        label: 'Heading 2',
        description: 'Medium heading',
        icon: <Heading2 size={18} />,
        command: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
    },
    {
        id: 'heading3',
        label: 'Heading 3',
        description: 'Small heading',
        icon: <Heading3 size={18} />,
        command: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
    },
    {
        id: 'bulletList',
        label: 'Bullet List',
        description: 'Unordered list',
        icon: <List size={18} />,
        command: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
        id: 'orderedList',
        label: 'Numbered List',
        description: 'Ordered list',
        icon: <ListOrdered size={18} />,
        command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
        id: 'taskList',
        label: 'To-do List',
        description: 'Checklist with checkboxes',
        icon: <ListChecks size={18} />,
        command: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
        id: 'codeBlock',
        label: 'Code Block',
        description: 'Code with syntax highlighting',
        icon: <Code size={18} />,
        command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
        id: 'blockquote',
        label: 'Blockquote',
        description: 'Quote block',
        icon: <Quote size={18} />,
        command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
        id: 'image',
        label: 'Image',
        description: 'Upload or embed with a link.',
        icon: <ImageIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />,
        command: (editor) => editor.chain().focus().setPlaceholderImage().run(), // Uses our custom ResizableImage command
    },
    {
        id: 'file',
        label: 'File',
        description: 'Upload a file attachment.',
        icon: <Paperclip className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />,
        command: (editor) => editor.chain().focus().setPlaceholderFile().run(), // Uses our custom FileAttachment command
    },
    {
        id: 'video',
        label: 'YouTube Video',
        description: 'Embed a YouTube video.',
        icon: <Video className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />,
        command: (editor) => {
            let url = window.prompt('Enter YouTube URL or paste Embed code:');
            if (url) {
                if (url.includes('<iframe') && url.match(/src="([^"]+)"/)) {
                    url = url.match(/src="([^"]+)"/)?.[1] || url;
                }
                const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                if (videoIdMatch && videoIdMatch[1]) {
                    const embedUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}`;
                    editor.commands.setIframeEmbed({ src: embedUrl, title: 'YouTube Video', type: 'youtube' });
                } else {
                    toast.error('Please enter a valid YouTube URL');
                }
            }
        },
    },
    {
        id: 'twitter',
        label: 'Twitter / X Post',
        description: 'Embed a tweet or X post.',
        icon: <Twitter className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />,
        command: (editor) => {
            const url = window.prompt('Enter Twitter/X post URL (e.g. https://twitter.com/user/status/123):');
            if (url) {
                // Use the Twitter publish embed endpoint
                const embedSrc = `https://platform.twitter.com/embed/Tweet.html?id=${url.split('/').pop()}&theme=dark`;
                editor.commands.setIframeEmbed({ src: embedSrc, title: 'Twitter Post', type: 'twitter' });
            }
        },
    },
    {
        id: 'map',
        label: 'Google Map',
        description: 'Embed a Google Maps location.',
        icon: <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />,
        command: (editor) => {
            let url = window.prompt('Enter Google Maps embed URL, share link, or paste Embed code:');
            if (url) {
                if (url.includes('<iframe') && url.match(/src="([^"]+)"/)) {
                    url = url.match(/src="([^"]+)"/)?.[1] || url;
                }
                let embedSrc = url;
                // Convert share links to embed links if needed
                if (url.includes('google.com/maps') && !url.includes('/embed')) {
                    // Try to convert a place or @coordinates link to embed
                    if (url.includes('/place/') || url.includes('/@')) {
                        const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                        if (match) {
                            embedSrc = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${match[2]}!3d${match[1]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1`;
                        }
                    }
                }
                editor.commands.setIframeEmbed({ src: embedSrc, title: 'Google Map', type: 'map' });
            }
        },
    },
    {
        id: 'toggle',
        label: 'Toggle List',
        description: 'Collapsible content section.',
        icon: <ListCollapse className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />,
        command: (editor) => editor.chain().focus().setDetails().run(),
    },
    {
        id: 'math',
        label: 'Math Equation',
        description: 'Insert a LaTeX math block.',
        icon: <Sigma className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />,
        command: (editor) => editor.chain().focus().insertContent({ type: 'inlineMath' }).run(),
    },
    {
        id: 'divider',
        label: 'Divider',
        description: 'Visually divide blocks.',
        icon: <Minus className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />,
        command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
        id: 'table',
        label: 'Table',
        description: 'Add a simple tabular structure.',
        icon: <Table className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />,
        command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
        id: 'mention',
        label: 'Mention',
        description: 'Mention a teammate.',
        icon: <AtSign className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />,
        command: (editor) => editor.chain().focus().insertContent('@').run(),
    },
    {
        id: 'emoji',
        label: 'Emoji',
        description: 'Add some fun with emoji.',
        icon: <Smile className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />,
        command: (editor) => editor.chain().focus().insertContent(':').run(),
    },
    {
        id: 'toc',
        label: 'Table of contents',
        description: 'Document outline.',
        icon: <ListTree className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />,
        // ToC is automatically processed from headings, so just insert an H2 to kick it off or do nothing.
        // We'll just insert an H2
        command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    }
];

interface SlashMenuProps {
    editor: Editor;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({ editor }) => {
    const [active, setActive] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    const filteredItems = SLASH_ITEMS.filter(
        (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
    );

    // Listen to ProseMirror plugin state
    useEffect(() => {
        if (!editor) return;

        const updateHandler = () => {
            const state = SlashCommandPluginKey.getState(editor.state);
            if (state?.active) {
                setActive(true);
                setQuery(state.query);
                setSelectedIndex(0);

                // Get cursor position for menu placement
                const { from } = editor.state.selection;
                const coords = editor.view.coordsAtPos(from);
                const editorRect = editor.view.dom.closest('.notion-editor')?.getBoundingClientRect();
                if (editorRect) {
                    setPosition({
                        top: coords.bottom - editorRect.top + 8,
                        left: coords.left - editorRect.left,
                    });
                }
            } else {
                setActive(false);
                setQuery('');
            }
        };

        editor.on('transaction', updateHandler);
        return () => {
            editor.off('transaction', updateHandler);
        };
    }, [editor]);

    const selectItem = useCallback(
        (item: SlashItem) => {
            if (!editor) return;

            const state = SlashCommandPluginKey.getState(editor.state);

            // First dismiss the menu explicitly
            editor.view.dispatch(
                editor.state.tr.setMeta(SlashCommandPluginKey, {
                    active: false,
                    range: null,
                    query: '',
                })
            );

            // If we have a range (the slash and query), let's delete it
            if (state?.range) {
                try {
                    editor.chain().focus().deleteRange(state.range).run();
                } catch {
                    // Ignore range errors
                }
            } else {
                editor.commands.focus();
            }

            // Small timeout to ensure Tiptap finishes processing the deletion
            setTimeout(() => {
                item.command(editor);
            }, 10);
        },
        [editor]
    );

    // Keyboard navigation
    useEffect(() => {
        if (!active) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                selectItem(filteredItems[selectedIndex]);
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [active, filteredItems, selectedIndex, selectItem]);

    // Auto-scroll selected item into view (without scrolling the page)
    useEffect(() => {
        if (!active || !menuRef.current) return;
        const container = menuRef.current;
        const selected = container.children[selectedIndex] as HTMLElement | undefined;
        if (!selected) return;

        const containerScrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const itemTop = selected.offsetTop;
        const itemHeight = selected.offsetHeight;

        // Add a buffer to account for container padding (e.g. 6px padding)
        const buffer = 8;

        if (itemTop < containerScrollTop + buffer) {
            // Scroll up
            container.scrollTop = itemTop - buffer;
        } else if (itemTop + itemHeight > containerScrollTop + containerHeight - buffer) {
            // Scroll down
            container.scrollTop = itemTop + itemHeight - containerHeight + buffer;
        }
    }, [selectedIndex, active]);

    if (!active) return null;

    return (
        <div
            ref={menuRef}
            className="slash-menu"
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            {filteredItems.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    No results
                </div>
            ) : (
                filteredItems.map((item, index) => (
                    <button type="button"
                        key={item.id}
                        className={`slash-item ${index === selectedIndex ? 'selected' : ''}`}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            selectItem(item);
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        <span className="slash-icon">{item.icon}</span>
                        <span>
                            <span className="slash-label">{item.label}</span>
                            <br />
                            <span className="slash-desc">{item.description}</span>
                        </span>
                    </button>
                ))
            )}
        </div>
    );
};
