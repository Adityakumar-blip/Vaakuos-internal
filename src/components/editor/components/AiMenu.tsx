import React, { useState, useRef, useEffect } from 'react';
import {
    Sparkles,
    Wand2,
    Check,
    RefreshCcw,
    X,
    ChevronRight,
    Type,
    Maximize2,
    Minimize2,
    Languages,
    Zap,
    SmilePlus,
    ArrowUp,
    AlignLeft
} from 'lucide-react';
import { Editor } from '@tiptap/react';
import { askAI, AiAction } from '../../../services/aiService';

interface AiMenuProps {
    editor: Editor;
    onClose: () => void;
}

export const AiMenu: React.FC<AiMenuProps> = ({ editor, onClose }) => {
    const [customPrompt, setCustomPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedText, setGeneratedText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [activeSubMenu, setActiveSubMenu] = useState<'main' | 'tone' | 'language'>('main');

    const inputRef = useRef<HTMLInputElement>(null);
    const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        '\n'
    );

    useEffect(() => {
        if (activeSubMenu === 'main' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [activeSubMenu]);

    const handleAiAction = async (action: AiAction) => {
        if (!selectedText && typeof action !== 'string' && action.type === 'custom' && !customPrompt) {
            return; // Nothing to do
        }

        setIsLoading(true);
        setError(null);
        setGeneratedText('');

        try {
            // Get surrounding text for better context
            let context = '';
            if (editor.state.selection.empty || !selectedText) {
                const { from } = editor.state.selection;
                const start = Math.max(0, from - 500);
                const end = Math.min(editor.state.doc.content.size, from + 500);
                context = editor.state.doc.textBetween(start, end, '\n');
            }

            const result = await askAI(selectedText, action, context);
            setGeneratedText(result.trim());
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to generate response');
        } finally {
            setIsLoading(false);
        }
    };

    const applyChanges = () => {
        if (generatedText) {
            editor.chain().focus().insertContent(generatedText).run();
            onClose();
        }
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customPrompt.trim()) {
            handleAiAction({ type: 'custom', prompt: customPrompt });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-6 space-y-4 w-64">
                <div className="relative flex h-10 w-10">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                    <div className="relative inline-flex rounded-full h-10 w-10 bg-primary/20 items-center justify-center">
                        <Sparkles className="text-primary animate-pulse" size={20} />
                    </div>
                </div>
                <p className="text-sm text-muted-foreground animate-pulse font-medium">AI is thinking...</p>
            </div>
        );
    }

    if (generatedText) {
        return (
            <div className="flex flex-col w-[320px] max-h-[400px]">
                <div className="p-3 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
                        <Sparkles size={14} /> Generated Result
                    </div>
                    <div className="text-sm text-foreground overflow-y-auto max-h-[200px] leading-relaxed pr-1 custom-scrollbar">
                        {generatedText}
                    </div>
                </div>
                <div className="p-2 bg-background flex flex-col gap-1">
                    <form onSubmit={handleCustomSubmit} className="relative mb-2">
                        <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                            type="text"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Tell AI what else to change..."
                            className="w-full pl-8 pr-8 py-2 text-sm bg-muted/50 border border-transparent hover:border-border focus:border-primary rounded-md outline-none transition-colors"
                        />
                        <button
                            type="submit"
                            title="Generate"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                        >
                            <ArrowUp size={14} />
                        </button>
                    </form>
                    <div className="flex items-center justify-end gap-2 mt-1">
                        <button
                            type="button"
                            onClick={() => {
                                setGeneratedText('');
                                setCustomPrompt('');
                                setActiveSubMenu('main');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
                        >
                            <X size={14} /> Discard
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAiAction(customPrompt ? { type: 'custom', prompt: customPrompt } : 'improve')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
                        >
                            <RefreshCcw size={14} /> Try again
                        </button>
                        <button
                            type="button"
                            onClick={applyChanges}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-sm"
                        >
                            <Check size={14} /> Apply
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col p-4 w-64 items-center text-center">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                    <X className="text-destructive" size={20} />
                </div>
                <p className="text-sm text-destructive font-medium mb-1">Generation Failed</p>
                <p className="text-xs text-muted-foreground mb-4">{error}</p>
                <div className="flex w-full gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-1.5 text-xs font-medium bg-muted text-foreground hover:bg-muted/80 rounded-md transition-colors"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="flex-1 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (activeSubMenu === 'tone') {
        const tones = ['Academic', 'Business', 'Casual', 'Childfriendly', 'Confident', 'Conversational', 'Creative', 'Emotional', 'Excited', 'Formal', 'Friendly', 'Funny', 'Humorous', 'Informative'];
        return (
            <div className="flex flex-col w-56 py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                <button
                    type="button"
                    onClick={() => setActiveSubMenu('main')}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-1 sticky top-0 bg-background z-10"
                >
                    <ChevronRight className="rotate-180" size={14} /> Back
                </button>
                <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tone</div>
                {tones.map(tone => (
                    <button
                        key={tone}
                        type="button"
                        className="dropdown-item"
                        onClick={() => handleAiAction({ type: 'tone', tone })}
                    >
                        {tone}
                    </button>
                ))}
            </div>
        );
    }

    if (activeSubMenu === 'language') {
        const languages = ['English', 'Korean', 'Chinese', 'Japanese', 'Spanish', 'Russian', 'French', 'Portuguese', 'German', 'Italian', 'Dutch', 'Indonesian', 'Vietnamese', 'Turkish'];
        return (
            <div className="flex flex-col w-56 py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                <button
                    type="button"
                    onClick={() => setActiveSubMenu('main')}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-1 sticky top-0 bg-background z-10"
                >
                    <ChevronRight className="rotate-180" size={14} /> Back
                </button>
                <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Translate to</div>
                {languages.map(lang => (
                    <button
                        key={lang}
                        type="button"
                        className="dropdown-item"
                        onClick={() => handleAiAction({ type: 'translate', language: lang })}
                    >
                        {lang}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col w-64 py-2 max-h-[350px] overflow-y-auto custom-scrollbar">
            <div className="px-2 pb-2 mb-1 border-b border-border sticky top-0 bg-background z-10">
                <form onSubmit={handleCustomSubmit} className="relative">
                    <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary" size={14} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Ask AI what you want..."
                        className="w-full pl-8 pr-8 py-1.5 text-sm bg-muted/50 border border-transparent hover:border-border focus:border-primary rounded-md outline-none transition-colors"
                    />
                    <button
                        type="submit"
                        title="Generate"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                    >
                        <ArrowUp size={14} />
                    </button>
                </form>
            </div>

            <div className="px-3 py-1 mt-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Edit
            </div>

            <button
                type="button"
                className="dropdown-item flex items-center justify-between group"
                onClick={() => setActiveSubMenu('tone')}
            >
                <div className="flex items-center gap-2">
                    <span className="dropdown-icon group-hover:text-primary"><Type size={14} /></span>
                    Adjust Tone
                </div>
                <ChevronRight size={14} className="text-muted-foreground/50" />
            </button>

            <button
                type="button"
                className="dropdown-item group"
                onClick={() => handleAiAction('fix_spelling')}
            >
                <span className="dropdown-icon group-hover:text-primary"><Check size={14} /></span>
                Fix spelling & grammar
            </button>
            <button
                type="button"
                className="dropdown-item group"
                onClick={() => handleAiAction('make_longer')}
            >
                <span className="dropdown-icon group-hover:text-primary"><Maximize2 size={14} /></span>
                Make longer
            </button>
            <button
                type="button"
                className="dropdown-item group"
                onClick={() => handleAiAction('make_shorter')}
            >
                <span className="dropdown-icon group-hover:text-primary"><Minimize2 size={14} /></span>
                Make shorter
            </button>
            <button
                type="button"
                className="dropdown-item group"
                onClick={() => handleAiAction('simplify')}
            >
                <span className="dropdown-icon group-hover:text-primary"><Zap size={14} /></span>
                Simplify language
            </button>
            <button
                type="button"
                className="dropdown-item group"
                onClick={() => handleAiAction('improve')}
            >
                <span className="dropdown-icon group-hover:text-primary"><Sparkles size={14} /></span>
                Improve writing
            </button>
            <button
                type="button"
                className="dropdown-item group"
                onClick={() => handleAiAction('emojify')}
            >
                <span className="dropdown-icon group-hover:text-primary"><SmilePlus size={14} /></span>
                Emojify
            </button>

            <div className="h-px bg-border my-1 mx-2" />
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Write
            </div>

            <button
                type="button"
                className="dropdown-item group"
                onClick={() => handleAiAction('continue')}
            >
                <span className="dropdown-icon group-hover:text-primary"><Wand2 size={14} /></span>
                Continue writing
            </button>
            <button
                type="button"
                className="dropdown-item group"
                onClick={() => handleAiAction('summarize')}
            >
                <span className="dropdown-icon group-hover:text-primary"><AlignLeft size={14} /></span>
                Add a summary
            </button>
            <button
                type="button"
                className="dropdown-item flex items-center justify-between group"
                onClick={() => setActiveSubMenu('language')}
            >
                <div className="flex items-center gap-2">
                    <span className="dropdown-icon group-hover:text-primary"><Languages size={14} /></span>
                    Translate
                </div>
                <ChevronRight size={14} className="text-muted-foreground/50" />
            </button>
        </div>
    );
};
