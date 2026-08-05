import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { toast } from 'sonner';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Link as LinkIcon,
    ChevronDown,
    MoreHorizontal,
    Superscript,
    Subscript,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Palette,
    Merge,
    Split,
    Sparkles,
    Highlighter,
    List,
    ListOrdered,
    ListChecks,
    Quote,
    Minus,
    AtSign,
    Smile,
    Table as TableIcon,
    Image as ImageIcon,
    BookOpen,
    Undo,
    Redo
} from 'lucide-react';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import { ColorPicker } from './ColorPicker';
import { TurnIntoMenu, getBlockTypeLabel } from './TurnIntoMenu';
import { LinkEditor } from './LinkEditor';
import { AiMenu } from './AiMenu';

import { Editor } from '@tiptap/react';
import { CellSelection } from '@tiptap/pm/tables';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type ActivePanel = 'none' | 'turnInto' | 'color' | 'link' | 'more' | 'ai';

interface FloatingToolbarProps {
    editor: Editor | null;
    aiEnabled?: boolean;
}

const ToolbarButton = ({
    onClick,
    isActive = false,
    tooltip,
    children,
    className = "",
    disabled = false
}: {
    onClick: () => void;
    isActive?: boolean;
    tooltip: string;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}) => (
    <TooltipProvider delayDuration={0}>
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className={`toolbar-btn ${isActive ? 'active' : ''} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                        if (disabled) return;
                        e.preventDefault();
                        onClick();
                    }}
                >
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
                <p className="text-xs">{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

export const FloatingToolbar: React.FC<FloatingToolbarProps> = memo(({ editor, aiEnabled = false }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [activePanel, setActivePanel] = useState<ActivePanel>('none');
    const [updateTick, setUpdateTick] = useState(0); // Force re-render for active states
    const toolbarRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { refs, floatingStyles, update } = useFloating({
        placement: 'top',
        middleware: [offset(10), flip(), shift({ padding: 8 })],
        whileElementsMounted: autoUpdate,
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const src = readerEvent.target?.result as string;
            if (src) {
                editor.chain().focus().setImage({ src }).run();
            }
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Track selection changes
    useEffect(() => {
        if (!editor) return;

        const updateVisibility = () => {
            const { state } = editor;
            const { from, to, empty } = state.selection;

            if (empty || from === to) {
                setIsVisible(false);
                setActivePanel('none');
                return;
            }

            if (editor.isActive('codeBlock') || editor.isActive('image') || editor.isActive('iframeEmbed')) {
                setIsVisible(false);
                return;
            }

            // Hide toolbar when table context menu is open
            if (document.querySelector('.table-context-menu')) {
                setIsVisible(false);
                return;
            }

            // Hide toolbar for CellSelection (when row/col handles are clicked)
            if (state.selection instanceof CellSelection) {
                setIsVisible(false);
                return;
            }

            setIsVisible(true);
            setUpdateTick(t => t + 1); // Force re-render to update formatting button states
        };

        const forceUpdate = () => setUpdateTick(t => t + 1);

        editor.on('selectionUpdate', updateVisibility);
        editor.on('transaction', forceUpdate); // Catch format changes without selection movement
        editor.on('blur', () => {
            setTimeout(() => {
                if (!toolbarRef.current?.contains(document.activeElement) &&
                    !panelRef.current?.contains(document.activeElement)) {
                    setIsVisible(false);
                    setActivePanel('none');
                }
            }, 200);
        });

        return () => {
            editor.off('selectionUpdate', updateVisibility);
            editor.off('transaction', forceUpdate);
        };
    }, [editor]);

    // Position the floating element at the selection
    useEffect(() => {
        if (!editor || !isVisible) return;

        const virtualEl = {
            getBoundingClientRect() {
                const { from, to } = editor.state.selection;
                const start = editor.view.coordsAtPos(from);
                const end = editor.view.coordsAtPos(to);
                return {
                    x: start.left,
                    y: start.top,
                    width: end.right - start.left,
                    height: end.bottom - start.top,
                    top: start.top,
                    left: start.left,
                    right: end.right,
                    bottom: end.bottom,
                };
            },
            contextElement: editor.view.dom,
        };

        refs.setReference(virtualEl);
    }, [editor, isVisible, refs, editor?.state?.selection]);

    // Also update position on scroll of any ancestor
    useEffect(() => {
        if (!editor || !isVisible || !update) return;

        const scrollParents: Element[] = [];
        let el: Element | null = editor.view.dom;
        while (el) {
            if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
                scrollParents.push(el);
            }
            el = el.parentElement;
        }
        // Also listen on window scroll
        const onScroll = (e: Event) => {
            update();
            // Only close panel if scroll is OUTSIDE the panel (not inside the dropdown itself)
            if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) {
                return; // scrolling inside the panel — keep it open
            }
            setActivePanel('none');
        };
        scrollParents.forEach((sp) => sp.addEventListener('scroll', onScroll as EventListener, { passive: true }));
        window.addEventListener('scroll', onScroll as EventListener, { passive: true });

        return () => {
            scrollParents.forEach((sp) => sp.removeEventListener('scroll', onScroll));
            window.removeEventListener('scroll', onScroll);
        };
    }, [editor, isVisible, update]);

    // Close panels on outside click
    useEffect(() => {
        if (activePanel === 'none') return;

        const handleClick = (e: MouseEvent) => {
            if (
                toolbarRef.current &&
                !toolbarRef.current.contains(e.target as Node) &&
                panelRef.current &&
                !panelRef.current.contains(e.target as Node)
            ) {
                setActivePanel('none');
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [activePanel]);

    const togglePanel = useCallback((panel: ActivePanel) => {
        setActivePanel((prev) => (prev === panel ? 'none' : panel));
    }, []);

    if (!editor || !isVisible) return null;

    const blockLabel = getBlockTypeLabel(editor);

    return (
        <>
            <div
                ref={(node) => {
                    toolbarRef.current = node;
                    refs.setFloating(node);
                }}
                className="floating-toolbar"
                style={floatingStyles}
            >
                {/* AI Button */}
                {aiEnabled && (
                    <>
                        <div className="relative">
                            <ToolbarButton
                                className={`text-primary hover:bg-primary/10 ${activePanel === 'ai' ? 'active bg-primary/10' : ''}`}
                                onClick={() => togglePanel('ai')}
                                tooltip="Ask AI"
                            >
                                <Sparkles size={16} className="animate-pulse-slow" />
                                {/* <span className="ml-1 text-xs font-medium">Improve</span> */}
                            </ToolbarButton>
                            {activePanel === 'ai' && (
                                <div className="absolute top-full left-0 mt-2 z-50" ref={panelRef}>
                                    <div className="editor-dropdown p-0 border-primary/20 shadow-lg shadow-primary/5">
                                        <AiMenu editor={editor} onClose={() => setActivePanel('none')} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="toolbar-divider" />
                    </>
                )}

                {/* Block type dropdown (Turn Into) */}
                <div className="relative">
                    <button type="button"
                        className="block-type-btn"
                        onClick={() => togglePanel('turnInto')}
                    >
                        {blockLabel}
                        <ChevronDown size={12} />
                    </button>
                    {activePanel === 'turnInto' && (
                        <div className="absolute top-full left-0 mt-2 z-50" ref={panelRef}>
                            <TurnIntoMenu
                                editor={editor}
                                onClose={() => setActivePanel('none')}
                            />
                        </div>
                    )}
                </div>

                <div className="toolbar-divider" />

                {/* Formatting buttons */}
                <ToolbarButton
                    isActive={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    tooltip="Bold"
                >
                    <Bold size={16} />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    tooltip="Italic"
                >
                    <Italic size={16} />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    tooltip="Underline"
                >
                    <UnderlineIcon size={16} />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive('strike')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    tooltip="Strikethrough"
                >
                    <Strikethrough size={16} />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive('code')}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    tooltip="Inline Code"
                >
                    <Code size={16} />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive('highlight')}
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    tooltip="Highlight"
                >
                    <Highlighter size={16} />
                </ToolbarButton>

                <div className="toolbar-divider" />

                <ToolbarButton
                    isActive={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    tooltip="Bullet List"
                >
                    <List size={16} />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    tooltip="Numbered List"
                >
                    <ListOrdered size={16} />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive('taskList')}
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    tooltip="Task List"
                >
                    <ListChecks size={16} />
                </ToolbarButton>
                <ToolbarButton
                    isActive={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    tooltip="Blockquote"
                >
                    <Quote size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    tooltip="Divider"
                >
                    <Minus size={16} />
                </ToolbarButton>

                <div className="toolbar-divider" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().insertContent('@').run()}
                    tooltip="Mention"
                >
                    <AtSign size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().insertContent(':').run()}
                    tooltip="Emoji"
                >
                    <Smile size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    tooltip="Insert Table"
                >
                    <TableIcon size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().insertContent({ type: 'tableOfContents' }).run()}
                    tooltip="Insert Table of Contents"
                >
                    <BookOpen size={16} />
                </ToolbarButton>

                <div className="toolbar-divider" />

                {editor.isActive('table') && (
                    <>
                        {editor.can().mergeCells() && (
                            <ToolbarButton
                                onClick={() => editor.chain().focus().mergeCells().run()}
                                tooltip="Merge cells"
                            >
                                <Merge size={16} />
                            </ToolbarButton>
                        )}
                        {editor.can().splitCell() && (
                            <ToolbarButton
                                onClick={() => editor.chain().focus().splitCell().run()}
                                tooltip="Split cell"
                            >
                                <Split size={16} />
                            </ToolbarButton>
                        )}
                        {(editor.can().mergeCells() || editor.can().splitCell()) && <div className="toolbar-divider" />}
                    </>
                )}

                {/* Link */}
                <div className="relative">
                    <ToolbarButton
                        isActive={activePanel === 'link' || editor.isActive('link')}
                        onClick={() => togglePanel('link')}
                        tooltip="Link"
                    >
                        <LinkIcon size={16} />
                    </ToolbarButton>
                    {activePanel === 'link' && (
                        <div className="absolute top-[calc(100%+8px)] right-0 z-50 w-64" ref={panelRef}>
                            <div className="editor-dropdown">
                                <LinkEditor editor={editor} onClose={() => setActivePanel('none')} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Image Upload */}
                <ToolbarButton
                    onClick={() => fileInputRef.current?.click()}
                    tooltip="Upload Image"
                >
                    <ImageIcon size={16} />
                </ToolbarButton>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />

                {/* Color */}
                <div className="relative">
                    <ToolbarButton
                        isActive={activePanel === 'color'}
                        onClick={() => togglePanel('color')}
                        tooltip="Text color"
                    >
                        <div className="flex items-center gap-0.5" style={{ color: editor.getAttributes('textStyle').color || undefined }}>
                            <span className="text-[14px] font-bold leading-none font-serif relative top-[1px]"
                                style={{ backgroundColor: editor.getAttributes('highlight').color || undefined }}
                            >A</span>
                            <ChevronDown size={12} className="text-muted-foreground" />
                        </div>
                    </ToolbarButton>
                    {activePanel === 'color' && (
                        <div className="absolute top-[calc(100%+8px)] right-0 z-50 w-[240px]" ref={panelRef}>
                            <div className="editor-dropdown">
                                <ColorPicker editor={editor} onClose={() => setActivePanel('none')} />
                            </div>
                        </div>
                    )}
                </div>

                {/* More options */}
                <div className="relative">
                    <ToolbarButton
                        isActive={activePanel === 'more'}
                        onClick={() => togglePanel('more')}
                        tooltip="More options"
                    >
                        <MoreHorizontal size={16} />
                    </ToolbarButton>
                    {activePanel === 'more' && (
                        <div className="absolute bottom-[calc(100%+8px)] right-0 z-50 w-max" ref={panelRef}>
                            <div className="floating-toolbar flex-nowrap" style={{ margin: 0 }}>
                                <ToolbarButton
                                    isActive={editor.isActive('superscript')}
                                    onClick={() => {
                                        editor.chain().focus().toggleSuperscript().run();
                                    }}
                                    tooltip="Superscript"
                                >
                                    <Superscript size={16} />
                                </ToolbarButton>
                                <ToolbarButton
                                    isActive={editor.isActive('subscript')}
                                    onClick={() => {
                                        editor.chain().focus().toggleSubscript().run();
                                    }}
                                    tooltip="Subscript"
                                >
                                    <Subscript size={16} />
                                </ToolbarButton>
                                <div className="toolbar-divider" />
                                <ToolbarButton
                                    isActive={editor.isActive({ textAlign: 'left' })}
                                    onClick={() => {
                                        editor.chain().focus().setTextAlign('left').run();
                                    }}
                                    tooltip="Align left"
                                >
                                    <AlignLeft size={16} />
                                </ToolbarButton>
                                <ToolbarButton
                                    isActive={editor.isActive({ textAlign: 'center' })}
                                    onClick={() => {
                                        editor.chain().focus().setTextAlign('center').run();
                                    }}
                                    tooltip="Align center"
                                >
                                    <AlignCenter size={16} />
                                </ToolbarButton>
                                <ToolbarButton
                                    isActive={editor.isActive({ textAlign: 'right' })}
                                    onClick={() => {
                                        editor.chain().focus().setTextAlign('right').run();
                                    }}
                                    tooltip="Align right"
                                >
                                    <AlignRight size={16} />
                                </ToolbarButton>
                                <ToolbarButton
                                    isActive={editor.isActive({ textAlign: 'justify' })}
                                    onClick={() => {
                                        editor.chain().focus().setTextAlign('justify').run();
                                    }}
                                    tooltip="Justify"
                                >
                                    <AlignJustify size={16} />
                                </ToolbarButton>
                            </div>
                        </div>
                    )}
                </div>

                <div className="toolbar-divider" />

                {/* Undo / Redo */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    tooltip="Undo"
                >
                    <Undo size={16} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    tooltip="Redo"
                >
                    <Redo size={16} />
                </ToolbarButton>
            </div>
        </>
    );
});

FloatingToolbar.displayName = 'FloatingToolbar';
