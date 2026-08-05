import { Node, mergeAttributes, nodePasteRule } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';
import { Rnd, RndResizeCallback } from 'react-rnd';
import { AlignLeft, AlignCenter, AlignRight, GripHorizontal } from 'lucide-react';

export interface IframeEmbedOptions {
    allowFullscreen: boolean;
    HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        iframeEmbed: {
            /**
             * Insert an iframe embed (Twitter, Google Maps, etc.)
             */
            setIframeEmbed: (options: { src: string; title?: string; type?: string }) => ReturnType;
        };
    }
}

// Size presets 
const SIZE_PRESETS = [
    { label: 'S', width: '40%', tooltip: 'Small' },
    { label: 'M', width: '60%', tooltip: 'Medium' },
    { label: 'L', width: '80%', tooltip: 'Large' },
    { label: 'Full', width: '100%', tooltip: 'Full Width' },
];

const IframeNodeView = (props: NodeViewProps) => {
    const { node, updateAttributes, selected } = props;
    const { src, title, type, width, alignment } = node.attrs;
    const [currentHeight, setCurrentHeight] = useState(type === 'twitter' ? 500 : 400);
    const [isResizing, setIsResizing] = useState(false);

    const handleResizeStart = () => {
        setIsResizing(true);
    };

    const handleResizeStop: RndResizeCallback = (_e, _direction, ref) => {
        setIsResizing(false);
        updateAttributes({ width: ref.style.width });
        setCurrentHeight(parseInt(ref.style.height, 10) || currentHeight);
    };

    const setAlign = (align: 'left' | 'center' | 'right') => {
        updateAttributes({ alignment: align });
    };

    const justifyMap = {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end',
    };

    const defaultWidth = width || '100%';

    return (
        <NodeViewWrapper
            className="resizable-embed-wrapper my-4 flex w-full"
            style={{ justifyContent: justifyMap[alignment as keyof typeof justifyMap] || 'center' }}
        >
            <Rnd
                size={{ width: defaultWidth, height: currentHeight }}
                position={{ x: 0, y: 0 }}
                onResizeStart={handleResizeStart}
                onResizeStop={handleResizeStop}
                disableDragging={true}
                enableResizing={{
                    top: false, right: true, bottom: true, left: true,
                    topRight: false, bottomRight: true, bottomLeft: true, topLeft: false,
                }}
                className={`relative group flex max-w-full ${selected ? 'ProseMirror-selectednode ring-2 ring-primary ring-offset-2 rounded-md' : ''}`}
                style={{ position: 'relative' as React.CSSProperties['position'] }}
                bounds="parent"
                minWidth={200}
                minHeight={150}
            >
                <iframe
                    src={src}
                    title={title || 'Embedded content'}
                    width="100%"
                    height="100%"
                    style={{
                        border: 'none',
                        borderRadius: '8px',
                        pointerEvents: selected || isResizing ? 'none' : 'auto',
                    }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                />

                {/* Drag & Select Handle (shows on hover) */}
                <div
                    className={`absolute top-2 right-2 z-30 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                    <div
                        className="bg-background border border-border rounded-md text-muted-foreground hover:text-foreground shadow-sm p-1.5 cursor-pointer flex items-center gap-1"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!selected && typeof props.getPos === 'function') {
                                props.editor.commands.setNodeSelection(props.getPos());
                            }
                        }}
                        data-drag-handle
                        title="Drag to move, click to select & resize"
                    >
                        <GripHorizontal size={16} />
                    </div>
                </div>

                {/* Transparent blocker during resize to prevent iframe from swallowing mouse events */}
                {isResizing && <div className="absolute inset-0 z-40 bg-transparent cursor-se-resize" />}

                {/* Resize grip indicator (bottom-right corner) */}
                <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-60 transition-opacity z-20"
                    style={{ background: 'linear-gradient(135deg, transparent 50%, hsl(var(--muted-foreground)) 50%)', borderRadius: '0 0 8px 0' }}
                />

                {/* Toolbar: Size Presets + Alignment */}
                {selected && (
                    <div
                        className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-popover border shadow-lg p-1 rounded-lg z-50 select-none animate-in fade-in zoom-in-95 duration-200"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Size presets */}
                        {SIZE_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    updateAttributes({ width: preset.width });
                                }}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${width === preset.width
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                title={preset.tooltip}
                            >
                                {preset.label}
                            </button>
                        ))}

                        {/* Divider */}
                        <div className="w-px h-5 bg-border mx-1" />

                        {/* Alignment */}
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAlign('left'); }} className={`p-1.5 rounded transition-colors ${alignment === 'left' ? 'text-primary' : 'text-muted-foreground hover:bg-muted'}`} title="Align Left">
                            <AlignLeft size={14} />
                        </button>
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAlign('center'); }} className={`p-1.5 rounded transition-colors ${alignment === 'center' ? 'text-primary' : 'text-muted-foreground hover:bg-muted'}`} title="Align Center">
                            <AlignCenter size={14} />
                        </button>
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAlign('right'); }} className={`p-1.5 rounded transition-colors ${alignment === 'right' ? 'text-primary' : 'text-muted-foreground hover:bg-muted'}`} title="Align Right">
                            <AlignRight size={14} />
                        </button>
                    </div>
                )}
            </Rnd>
        </NodeViewWrapper>
    );
};

export const IframeEmbed = Node.create<IframeEmbedOptions>({
    name: 'iframeEmbed',

    group: 'block',

    atom: true,

    draggable: true,

    addOptions() {
        return {
            allowFullscreen: true,
            HTMLAttributes: {
                class: 'iframe-embed',
            },
        };
    },

    addAttributes() {
        return {
            src: {
                default: null,
            },
            title: {
                default: null,
            },
            type: {
                default: 'generic',
            },
            width: {
                default: '100%',
            },
            alignment: {
                default: 'center',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-iframe-embed]',
            },
            {
                tag: 'iframe',
                getAttrs: (element) => {
                    const dom = element as HTMLElement;
                    const src = dom.getAttribute('src');
                    if (src && (src.includes('youtube.com') || src.includes('youtu.be') || src.includes('google.com/maps'))) {
                        let type = 'generic';
                        if (src.includes('youtube.com') || src.includes('youtu.be')) type = 'youtube';
                        if (src.includes('google.com/maps')) type = 'map';
                        return { src, type };
                    }
                    return false;
                }
            }
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, { 'data-iframe-embed': '' }),
            [
                'iframe',
                mergeAttributes(HTMLAttributes, {
                    width: '100%',
                    height: '400',
                    style: 'border: 0; border-radius: 8px;',
                    loading: 'lazy',
                }),
            ],
        ];
    },

    addCommands() {
        return {
            setIframeEmbed:
                (options) =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: { ...options, width: '100%', alignment: 'center' },
                        });
                    },
        };
    },

    addPasteRules() {
        return [
            nodePasteRule({
                find: /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:\S+)?/g,
                type: this.type,
                getAttributes: match => {
                    return {
                        src: `https://www.youtube.com/embed/${match[1]}`,
                        type: 'youtube',
                    }
                },
            }),
            nodePasteRule({
                find: /(https?:\/\/www\.google\.com\/maps\/(?:embed\?pb=|place\/|@).+)/g,
                type: this.type,
                getAttributes: match => {
                    let src = match[0];
                    if (src.includes('/place/') || src.includes('/@')) {
                        const m = src.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                        if (m) {
                            src = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${m[2]}!3d${m[1]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1`;
                        }
                    }
                    return {
                        src,
                        type: 'map',
                    }
                },
            })
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(IframeNodeView);
    },
});
