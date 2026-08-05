import React, { useState, useRef, useEffect } from 'react';
import { CornerDownLeft, ExternalLink, Trash2 } from 'lucide-react';

interface LinkEditorProps {
    editor: any;
    onClose: () => void;
}

export const LinkEditor: React.FC<LinkEditorProps> = ({ editor, onClose }) => {
    const existingHref = editor.getAttributes('link').href || '';
    const [url, setUrl] = useState(existingHref);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    const applyLink = () => {
        if (!url) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: url })
                .run();
        }
        onClose();
    };

    const removeLink = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        onClose();
    };

    const openLink = () => {
        if (existingHref) {
            window.open(existingHref, '_blank');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyLink();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    return (
        <div className="link-editor-panel" onClick={(e) => e.stopPropagation()}>
            <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste a link..."
            />
            <button type="button" className="link-btn" onClick={applyLink} title="Apply link">
                <CornerDownLeft size={14} />
            </button>
            {existingHref && (
                <button type="button" className="link-btn" onClick={openLink} title="Open link">
                    <ExternalLink size={14} />
                </button>
            )}
            {existingHref && (
                <button type="button" className="link-btn" onClick={removeLink} title="Remove link">
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
};
