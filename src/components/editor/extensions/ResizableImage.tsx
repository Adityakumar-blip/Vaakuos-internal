import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState, useRef } from 'react';
import { Rnd, RndResizeCallback } from 'react-rnd';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';

export interface ResizableImageOptions {
    inline: boolean;
    allowBase64: boolean;
    HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        resizableImage: {
            setImage: (options: { src: string; alt?: string; title?: string; width?: string | number; alignment?: 'left' | 'center' | 'right' }) => ReturnType;
            setPlaceholderImage: () => ReturnType;
        }
    }
}

const ImageNodeView = (props: NodeViewProps) => {
    const { node, updateAttributes, selected } = props;
    const { src, alt, title, width, alignment, isPlaceholder } = node.attrs;

    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleResizeStop: RndResizeCallback = (e, direction, ref, delta, position) => {
        updateAttributes({
            width: ref.style.width,
        });
    };

    const setAlignment = (align: 'left' | 'center' | 'right') => {
        updateAttributes({ alignment: align });
    };

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            updateAttributes({
                src: dataUrl,
                isPlaceholder: false,
                width: '100%',
                alignment: 'center'
            });
            setLoading(false);
        };
        reader.readAsDataURL(file);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const justifyMap = {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end',
    };

    if (isPlaceholder || !src) {
        return (
            <NodeViewWrapper className="image-placeholder-block w-full my-6">
                <div
                    className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={onFileSelect}
                    />
                    {loading ? (
                        <div className="flex flex-col items-center text-muted-foreground animate-pulse">
                            <UploadCloud className="w-8 h-8 mb-2" />
                            <p className="text-sm font-medium">Processing image...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-muted-foreground cursor-pointer">
                            <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground/70" />
                            <p className="text-sm font-medium">Click to upload or drag and drop</p>
                            <p className="text-xs mt-1 opacity-70">JPEG, PNG, GIF, WebP</p>
                        </div>
                    )}
                </div>
            </NodeViewWrapper>
        );
    }

    const defaultWidth = width || '100%';

    return (
        <NodeViewWrapper
            className={`resizable-image-wrapper my-4 flex`}
            style={{ justifyContent: justifyMap[alignment as keyof typeof justifyMap] || 'center' }}
        >
            <div className={`relative group ${selected ? 'ProseMirror-selectednode' : ''}`}>
                <Rnd
                    size={{ width: defaultWidth, height: 'auto' }}
                    position={{ x: 0, y: 0 }}
                    onResizeStop={handleResizeStop}
                    disableDragging={true}
                    enableResizing={{
                        top: false, right: true, bottom: false, left: true,
                        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
                    }}
                    className={`relative flex max-w-full ${selected ? 'ring-2 ring-primary ring-offset-2 rounded-md' : ''}`}
                    style={{ position: 'relative' as React.CSSProperties['position'] }}
                    bounds="parent"
                >
                    <img
                        src={src}
                        alt={alt}
                        title={title}
                        className="w-full h-auto rounded-lg object-contain drag-none pointer-events-none"
                    />

                    {selected && (
                        <div
                            className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-popover border shadow-md p-1 rounded-md z-50 select-none"
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            <button type="button" onClick={() => setAlignment('left')} className={`p-1.5 rounded hover:bg-muted ${alignment === 'left' ? 'text-primary' : 'text-muted-foreground'}`}>Left</button>
                            <button type="button" onClick={() => setAlignment('center')} className={`p-1.5 rounded hover:bg-muted ${alignment === 'center' ? 'text-primary' : 'text-muted-foreground'}`}>Center</button>
                            <button type="button" onClick={() => setAlignment('right')} className={`p-1.5 rounded hover:bg-muted ${alignment === 'right' ? 'text-primary' : 'text-muted-foreground'}`}>Right</button>
                        </div>
                    )}
                </Rnd>
            </div>
        </NodeViewWrapper>
    );
};

export const ResizableImage = Node.create<ResizableImageOptions>({
    name: 'image',

    addOptions() {
        return {
            inline: false,
            allowBase64: false,
            HTMLAttributes: {},
        };
    },

    inline() {
        return this.options.inline;
    },

    group() {
        return this.options.inline ? 'inline' : 'block';
    },

    draggable: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            alt: {
                default: null,
            },
            title: {
                default: null,
            },
            width: {
                default: '100%',
            },
            alignment: {
                default: 'center', // left, center, right
            },
            isPlaceholder: {
                default: false,
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'img[src]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    },

    addCommands() {
        return {
            setImage: options => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
            setPlaceholderImage: () => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: { isPlaceholder: true },
                });
            },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView);
    },
});
