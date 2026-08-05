import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState, useRef } from 'react';
import {
    UploadCloud,
    File as FileIcon,
    FileText,
    FileCode,
    FileImage,
    FileAudio,
    FileVideo,
    FileArchive,
    Paperclip,
    Download
} from 'lucide-react';

export interface FileAttachmentOptions {
    HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        fileAttachment: {
            setFileAttachment: (options: { src: string; filename: string; filesize: string }) => ReturnType;
            setPlaceholderFile: () => ReturnType;
        }
    }
}

// Format bytes to a human readable format
function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Get the correct icon and color based on file extension
const getFileIconConfig = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'pdf':
            return { icon: <FileText size={20} />, colors: 'bg-red-500/10 text-red-500' };
        case 'doc':
        case 'docx':
        case 'rtf':
        case 'odt':
            return { icon: <FileText size={20} />, colors: 'bg-blue-500/10 text-blue-500' };
        case 'xls':
        case 'xlsx':
        case 'csv':
        case 'ods':
            return { icon: <FileText size={20} />, colors: 'bg-green-500/10 text-green-500' };
        case 'txt':
            return { icon: <FileText size={20} />, colors: 'bg-gray-500/10 text-gray-500' };
        case 'js':
        case 'ts':
        case 'jsx':
        case 'tsx':
        case 'html':
        case 'css':
        case 'json':
        case 'py':
            return { icon: <FileCode size={20} />, colors: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500' };
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp':
        case 'svg':
            return { icon: <FileImage size={20} />, colors: 'bg-purple-500/10 text-purple-500' };
        case 'mp3':
        case 'wav':
        case 'ogg':
            return { icon: <FileAudio size={20} />, colors: 'bg-pink-500/10 text-pink-500' };
        case 'mp4':
        case 'webm':
        case 'mov':
            return { icon: <FileVideo size={20} />, colors: 'bg-indigo-500/10 text-indigo-500' };
        case 'zip':
        case 'rar':
        case '7z':
        case 'tar':
        case 'gz':
            return { icon: <FileArchive size={20} />, colors: 'bg-stone-500/10 text-stone-500' };
        default:
            return { icon: <FileIcon size={20} />, colors: 'bg-orange-500/10 text-orange-500' };
    }
}

const FileNodeView = (props: NodeViewProps) => {
    const { node, updateAttributes, selected } = props;
    const { src, filename, filesize, isPlaceholder } = node.attrs;

    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        setLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            updateAttributes({
                src: dataUrl,
                filename: file.name,
                filesize: formatBytes(file.size),
                isPlaceholder: false,
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

    if (isPlaceholder || !src) {
        return (
            <NodeViewWrapper className="file-placeholder-block w-full my-6">
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
                        onChange={onFileSelect}
                    />
                    {loading ? (
                        <div className="flex flex-col items-center text-muted-foreground animate-pulse">
                            <UploadCloud className="w-8 h-8 mb-2" />
                            <p className="text-sm font-medium">Processing file...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-muted-foreground cursor-pointer">
                            <Paperclip className="w-8 h-8 mb-2 text-muted-foreground/70" />
                            <p className="text-sm font-medium">Click to attach file or drag and drop</p>
                            <p className="text-xs mt-1 opacity-70">Any file type</p>
                        </div>
                    )}
                </div>
            </NodeViewWrapper>
        );
    }

    const { icon, colors } = getFileIconConfig(filename);

    return (
        <NodeViewWrapper className="file-attachment-wrapper my-4">
            <div className={`relative flex items-center gap-4 p-4 rounded-xl border border-border bg-background transition-colors ${selected ? 'ring-2 ring-primary ring-offset-2' : 'hover:shadow-sm'}`}>
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg shrink-0 ${colors}`}>
                    {icon}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-base font-semibold truncate text-foreground">{filename}</span>
                    <span className="text-sm text-muted-foreground mt-0.5">{filesize}</span>
                </div>

                <a
                    href={src}
                    download={filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 hover:bg-muted rounded-md transition-colors shrink-0 ${colors.split(' ')[1]}`} // Use the same text color as the icon for the download button
                    title="Download File"
                    onMouseDown={(e) => e.stopPropagation()} // Prevent selecting the node when clicking download
                >
                    <Download size={20} />
                </a>
            </div>
        </NodeViewWrapper>
    );
};

export const FileAttachment = Node.create<FileAttachmentOptions>({
    name: 'fileAttachment',

    group: 'block',

    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            src: {
                default: null,
            },
            filename: {
                default: 'Unknown File',
            },
            filesize: {
                default: '0 KB',
            },
            isPlaceholder: {
                default: false,
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="file-attachment"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'file-attachment' })];
    },

    addCommands() {
        return {
            setFileAttachment: options => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
            setPlaceholderFile: () => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: { isPlaceholder: true },
                });
            },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(FileNodeView);
    },
});
