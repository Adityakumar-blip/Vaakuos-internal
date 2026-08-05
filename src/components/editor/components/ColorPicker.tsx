import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';

const TEXT_COLORS = [
    { name: 'Default', color: '' },
    { name: 'Gray', color: '#9ca3af' },
    { name: 'Brown', color: '#a78bfa' },
    { name: 'Orange', color: '#fb923c' },
    { name: 'Yellow', color: '#fbbf24' },
    { name: 'Green', color: '#4ade80' },
    { name: 'Blue', color: '#60a5fa' },
    { name: 'Purple', color: '#a78bfa' },
    { name: 'Pink', color: '#f472b6' },
    { name: 'Red', color: '#f87171' },
    { name: 'Teal', color: '#2dd4bf' },
    { name: 'Cyan', color: '#22d3ee' },
];

const HIGHLIGHT_COLORS = [
    { name: 'Default', color: '' },
    { name: 'Gray', color: '#374151' },
    { name: 'Brown', color: '#44403c' },
    { name: 'Orange', color: '#7c2d12' },
    { name: 'Yellow', color: '#713f12' },
    { name: 'Green', color: '#14532d' },
    { name: 'Blue', color: '#1e3a5f' },
    { name: 'Purple', color: '#3b0764' },
    { name: 'Pink', color: '#500724' },
    { name: 'Red', color: '#450a0a' },
    { name: 'Teal', color: '#042f2e' },
    { name: 'Cyan', color: '#083344' },
];

const RECENT_COLORS_KEY = 'vaakuos_recent_colors';
const MAX_RECENT_COLORS = 6;

type ColorItem = { name: string; color: string; isHighlight?: boolean };

interface ColorPickerProps {
    editor: Editor;
    onClose: () => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ editor, onClose }) => {
    const currentTextColor = editor.getAttributes('textStyle').color || '';
    const currentHighlight = editor.getAttributes('highlight').color || '';

    const [recentColors, setRecentColors] = useState<ColorItem[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(RECENT_COLORS_KEY);
        if (stored) {
            try {
                setRecentColors(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse recent colors', e);
            }
        }
    }, []);

    const saveRecentColor = (colorItem: ColorItem) => {
        if (!colorItem.color) return; // don't save default
        const updated = [colorItem, ...recentColors.filter(c => c.color !== colorItem.color || c.isHighlight !== colorItem.isHighlight)].slice(0, MAX_RECENT_COLORS);
        setRecentColors(updated);
        localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
    };

    const setTextColor = (color: string, name: string) => {
        if (color === '') {
            editor.chain().focus().unsetColor().run();
        } else {
            editor.chain().focus().setColor(color).run();
            saveRecentColor({ name, color });
        }
        onClose();
    };

    const setHighlightColor = (color: string, name: string) => {
        if (color === '') {
            editor.chain().focus().unsetHighlight().run();
        } else {
            editor.chain().focus().setHighlight({ color }).run();
            saveRecentColor({ name, color, isHighlight: true });
        }
        onClose();
    };

    const applyRecentColor = (item: ColorItem) => {
        if (item.isHighlight) {
            setHighlightColor(item.color, item.name);
        } else {
            setTextColor(item.color, item.name);
        }
    };

    return (
        <div className="color-picker-panel">
            {recentColors.length > 0 && (
                <>
                    <div className="color-section-label">Recently Used</div>
                    <div className="color-grid">
                        {recentColors.map((c, i) => (
                            <button type="button"
                                key={`recent-${i}`}
                                className={`color-swatch ${(!c.isHighlight && currentTextColor === c.color) || (c.isHighlight && currentHighlight === c.color) ? 'active' : ''}`}
                                style={{
                                    background: c.color || (c.isHighlight ? 'hsl(var(--muted))' : 'hsl(var(--foreground))'),
                                    color: !c.isHighlight && c.color ? '#fff' : undefined,
                                }}
                                onClick={() => applyRecentColor(c)}
                                title={c.name}
                            >
                                {!c.isHighlight && 'A'}
                            </button>
                        ))}
                    </div>
                </>
            )}

            <div className="color-section-label">Text Color</div>
            <div className="color-grid">
                {TEXT_COLORS.map((c) => (
                    <button type="button"
                        key={`text-${c.name}`}
                        className={`color-swatch ${currentTextColor === c.color ? 'active' : ''}`}
                        style={{
                            background: c.color || 'hsl(var(--foreground))',
                            color: c.color ? '#fff' : undefined,
                        }}
                        onClick={() => setTextColor(c.color, c.name)}
                        title={c.name}
                    >
                        A
                    </button>
                ))}
            </div>

            <div className="color-section-label">Highlight Color</div>
            <div className="color-grid">
                {HIGHLIGHT_COLORS.map((c) => (
                    <button type="button"
                        key={`highlight-${c.name}`}
                        className={`color-swatch ${currentHighlight === c.color ? 'active' : ''}`}
                        style={{
                            background: c.color || 'hsl(var(--muted))',
                        }}
                        onClick={() => setHighlightColor(c.color, c.name)}
                        title={c.name}
                    />
                ))}
            </div>
        </div>
    );
};
