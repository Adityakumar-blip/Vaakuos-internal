import React, { useState, useEffect, useRef, memo } from 'react';
import { toast } from 'sonner';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { TableOfContentsNode } from '../editor/extensions/TableOfContentsNode';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Youtube from '@tiptap/extension-youtube';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CharacterCount from '@tiptap/extension-character-count';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import TextAlign from '@tiptap/extension-text-align';
import { Mention } from '@tiptap/extension-mention';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import { PluginKey } from 'prosemirror-state';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import MathExtension from '@aarkue/tiptap-math-extension';
import { all, createLowlight } from 'lowlight';
import 'katex/dist/katex.min.css';

const lowlight = createLowlight(all);

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ListChecks,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  AtSign,
  Smile,
  Table as TableIcon,
  BookOpen,
  Paperclip,
  Video,
  ListCollapse,
  Sigma,
  MapPin,
  Twitter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPicker } from '../editor/components/ColorPicker';

// Editor components
import { FloatingToolbar } from '../editor/components/FloatingToolbar';
import { SlashMenu } from '../editor/components/SlashMenu';
import { BlockHandle } from '../editor/components/BlockHandle';
import { SlashCommand } from '../editor/extensions/SlashCommand';
import { ResizableImage } from '../editor/extensions/ResizableImage';
import { FileAttachment } from '../editor/extensions/FileAttachment';
import { IframeEmbed } from '../editor/extensions/IframeEmbed';
import { ToggleList } from '../editor/extensions/ToggleList';
import { EmojiSuggestion } from '../editor/extensions/EmojiSuggestion';
import { MentionSuggestion } from '../editor/extensions/MentionSuggestion';
import { TableContextMenu } from '../editor/components/TableContextMenu';
import { TableEdgeMenu } from '../editor/components/TableEdgeMenu';
import { TableGrips } from '../editor/extensions/TableGrips';
import { TableOfContents } from './TableOfContents';
import { AiAutocomplete } from '../editor/extensions/AiAutocomplete';

// Editor styles
import '../editor/EditorStyles.css';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  aiEnabled?: boolean;
}

/* ---- Top Menu Bar Button ---- */
const MenuButton = ({
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  children
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            isActive && "bg-muted text-primary",
            !isActive && "text-muted-foreground"
          )}
          onClick={(e) => {
            e.preventDefault();
            onClick();
          }}
          disabled={disabled}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

/* ---- Non-sticky Top Toolbar ---- */
const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/20 z-10 transition-colors">
      {/* Headings */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-border h-8">
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} tooltip="Heading 1">
          <Heading1 size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} tooltip="Heading 2">
          <Heading2 size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} tooltip="Heading 3">
          <Heading3 size={18} />
        </MenuButton>
      </div>

      {/* Text formatting */}
      <div className="flex items-center gap-0.5 px-2 border-r border-border h-8">
        <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} tooltip="Bold">
          <Bold size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} tooltip="Italic">
          <Italic size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} tooltip="Underline">
          <UnderlineIcon size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} tooltip="Strikethrough">
          <Strikethrough size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} tooltip="Code">
          <Code size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} tooltip="Highlight">
          <Highlighter size={18} />
        </MenuButton>
      </div>

      {/* Lists & blocks */}
      <div className="flex items-center gap-0.5 px-2 border-r border-border h-8">
        <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} tooltip="Bullet List">
          <List size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} tooltip="Numbered List">
          <ListOrdered size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} tooltip="Task List">
          <ListChecks size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setDetails().run()} isActive={editor.isActive('details')} tooltip="Toggle List">
          <ListCollapse size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} tooltip="Blockquote">
          <Quote size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} tooltip="Divider">
          <Minus size={18} />
        </MenuButton>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-0.5 px-2 border-r border-border h-8">
        <MenuButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} tooltip="Align Left">
          <AlignLeft size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} tooltip="Align Center">
          <AlignCenter size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} tooltip="Align Right">
          <AlignRight size={18} />
        </MenuButton>
      </div>

      {/* Color */}
      <div className="flex items-center gap-0.5 px-2 border-r border-border h-8">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Palette size={18} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-border" align="start" sideOffset={8}>
            <ColorPicker editor={editor} onClose={() => { }} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Link, Image, File, Embeds */}
      <div className="flex items-center gap-0.5 px-2 border-r border-border h-8">
        <MenuButton onClick={setLink} isActive={editor.isActive('link')} tooltip="Add Link">
          <LinkIcon size={18} />
        </MenuButton>
        <MenuButton onClick={() => fileInputRef.current?.click()} tooltip="Upload Image">
          <ImageIcon size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().setPlaceholderFile().run()} tooltip="Attach File">
          <Paperclip size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => {
            const url = window.prompt('Enter YouTube URL:');
            if (url) {
              editor.commands.setYoutubeVideo({ src: url });
            }
          }}
          isActive={editor.isActive('youtube')}
          tooltip="Embed YouTube Video"
        >
          <Video size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => {
            const url = window.prompt('Enter Twitter/X post URL (e.g. https://twitter.com/user/status/123):');
            if (url) {
              const embedSrc = `https://platform.twitter.com/embed/Tweet.html?id=${url.split('/').pop()}&theme=dark`;
              editor.commands.setIframeEmbed({ src: embedSrc, title: 'Twitter Post', type: 'twitter' });
            }
          }}
          tooltip="Embed Twitter / X Post"
        >
          <Twitter size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => {
            let url = window.prompt('Enter Google Maps embed URL, share link, or paste Embed code:');
            if (url) {
              if (url.includes('<iframe') && url.match(/src="([^"]+)"/)) {
                url = url.match(/src="([^"]+)"/)?.[1] || url;
              }
              let embedSrc = url;
              if (url.includes('google.com/maps') && !url.includes('/embed')) {
                if (url.includes('/place/') || url.includes('/@')) {
                  const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                  if (match) {
                    embedSrc = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${match[2]}!3d${match[1]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1`;
                  }
                }
              }
              editor.commands.setIframeEmbed({ src: embedSrc, title: 'Google Map', type: 'map' });
            }
          }}
          tooltip="Embed Google Map"
        >
          <MapPin size={18} />
        </MenuButton>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </div>

      {/* Mentions & Emojis */}
      <div className="flex items-center gap-0.5 px-2 border-r border-border h-8">
        <MenuButton onClick={() => editor.chain().focus().insertContent('@').run()} tooltip="Mention">
          <AtSign size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().insertContent(':').run()} tooltip="Emoji">
          <Smile size={18} />
        </MenuButton>
      </div>

      {/* Table & TOC */}
      <div className="flex items-center gap-0.5 px-2 border-r border-border h-8">
        <MenuButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} tooltip="Insert Table">
          <TableIcon size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().insertContent({ type: 'tableOfContents' }).run()} tooltip="Insert Table of Contents">
          <BookOpen size={18} />
        </MenuButton>
      </div>

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 pl-2 ml-auto">
        <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} tooltip="Undo">
          <Undo size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} tooltip="Redo">
          <Redo size={18} />
        </MenuButton>
      </div>
    </div>
  );
};

export const RichEditor = memo(({ value, onChange, placeholder, className, aiEnabled = false }: RichEditorProps) => {
  const [characterCount, setCharacterCount] = useState(0);
  const lastEmittedValue = useRef(value);
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            // Needed for Table of Contents
          },
        },
        codeBlock: false, // Disable default to use lowlight
        // Disable extensions that are explicitly added below to avoid duplicates
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        HTMLAttributes: {
          class: 'code-block',
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-medium',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        suggestion: MentionSuggestion as any,
      }),
      Extension.create({
        name: 'emojiCommand',
        addOptions() {
          return {
            suggestion: {
              char: ':',
              pluginKey: new PluginKey('emojiCommand'),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              command: ({ editor, range, props }: any) => {
                editor.chain().focus().insertContentAt(range, props.id).run();
              },
            },
          };
        },
        addProseMirrorPlugins() {
          return [
            Suggestion({
              editor: this.editor,
              ...this.options.suggestion,
              ...EmojiSuggestion,
            }),
          ];
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'w-full mb-6 border-collapse border border-border/50',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-border/50 hover:bg-muted/30 transition-colors',
        },
      }),
      TableHeader.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            backgroundColor: {
              default: null,
              parseHTML: element => element.style.backgroundColor || null,
              renderHTML: attributes => {
                if (!attributes.backgroundColor) return {}
                return { style: `background-color: ${attributes.backgroundColor}` }
              },
            },
            verticalAlign: {
              default: null,
              parseHTML: element => element.style.verticalAlign || null,
              renderHTML: attributes => {
                if (!attributes.verticalAlign) return {}
                return { style: `vertical-align: ${attributes.verticalAlign}` }
              },
            }
          }
        }
      }).configure({
        HTMLAttributes: {
          class: 'border-r border-border/50 bg-muted/50 p-3 text-left font-semibold text-foreground align-top',
        },
      }),
      IframeEmbed,
      ToggleList,
      FileAttachment,
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            backgroundColor: {
              default: null,
              parseHTML: element => element.style.backgroundColor || null,
              renderHTML: attributes => {
                if (!attributes.backgroundColor) return {}
                return { style: `background-color: ${attributes.backgroundColor}` }
              },
            },
            verticalAlign: {
              default: null,
              parseHTML: element => element.style.verticalAlign || null,
              renderHTML: attributes => {
                if (!attributes.verticalAlign) return {}
                return { style: `vertical-align: ${attributes.verticalAlign}` }
              },
            }
          }
        }
      }).configure({
        HTMLAttributes: {
          class: 'border-r border-border/50 p-3 align-top',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc ml-4 space-y-1 marker:text-muted-foreground',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal ml-4 space-y-1 marker:text-muted-foreground font-medium',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'leading-relaxed',
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2 mb-2 w-full',
        },
      }),
      Superscript,
      Subscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      ResizableImage.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`;
          }
          return placeholder || "Type '/' for commands...";
        },
      }),
      CharacterCount,
      TableGrips,
      TableOfContentsNode,
      MathExtension.configure({
        evaluation: false, // Turn off automatic equation evaluation
      }),
      AiAutocomplete.configure({
        debounceTime: 600,
        enabled: aiEnabled,
      }),
      SlashCommand.configure({
        suggestion: {
          items: ({ editor }) => [
            {
              title: 'Heading 1',
              description: 'Big section heading.',
              icon: Heading1,
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
              },
            },
            {
              title: 'Heading 2',
              description: 'Medium section heading.',
              icon: Heading2,
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
              },
            },
            {
              title: 'Heading 3',
              description: 'Small section heading.',
              icon: Heading3,
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
              },
            },
            {
              title: 'Bullet List',
              description: 'Create a simple bullet list.',
              icon: List,
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
              },
            },
            {
              title: 'Numbered List',
              description: 'Create a list with numbering.',
              icon: ListOrdered,
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
              },
            },
            {
              title: 'Task List',
              description: 'Track tasks with a to-do list.',
              icon: ListChecks,
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleTaskList().run();
              },
            },
            {
              title: 'Table of Contents',
              description: 'Add a helpful outline of your document.',
              icon: List,
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).insertContent({ type: 'tableOfContents' }).run();
              },
            },
            {
              title: 'Math Equation',
              description: 'Insert a LaTeX math block.',
              icon: Sigma,
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).insertContent({ type: 'inlineMath' }).run();
              },
            },
          ],
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedValue.current = html;
      onChange(html);
      setCharacterCount(editor.storage.characterCount.characters());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-6 text-foreground bg-background leading-relaxed',
          className
        ),
      },
      transformPastedHTML(html) {
        // Strip out dark text colors often pasted from white-background editors (Notion, Google Docs, Word)
        // If we don't, the text will be invisible when the user switches to Dark Mode.
        return html.replace(/color:\s*(rgb\(\s*[0-6]?[0-9]\s*,\s*[0-6]?[0-9]\s*,\s*[0-6]?[0-9]\s*\)|#000000|#111111|#222222|#333333|#000|#111|#222|#333);?/gi, '');
      },
      handleDrop: (view, event) => {
        // Handle image drop
        const hasFiles = event.dataTransfer?.files?.length;
        if (hasFiles) {
          const files = Array.from(event.dataTransfer!.files);
          const images = files.filter((file) => file.type.startsWith('image/'));

          if (images.length > 0) {
            event.preventDefault();

            images.forEach((image) => {
              const reader = new FileReader();
              reader.onload = (readerEvent) => {
                const src = readerEvent.target?.result as string;
                if (src) {
                  const pos = view.posAtCoords({
                    left: event.clientX,
                    top: event.clientY,
                  });
                  if (pos) {
                    const node = view.state.schema.nodes.image.create({ src });
                    const tr = view.state.tr.insert(pos.pos, node);
                    view.dispatch(tr);
                  }
                }
              };
              reader.readAsDataURL(image);
            });

            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        // Handle image paste
        const items = Array.from(event.clipboardData?.items || []);
        const images = items.filter((item) => item.type.startsWith('image/'));

        if (images.length > 0) {
          event.preventDefault();

          images.forEach((item) => {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (readerEvent) => {
                const src = readerEvent.target?.result as string;
                if (src) {
                  const node = view.state.schema.nodes.image.create({ src });
                  const tr = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(tr);
                }
              };
              reader.readAsDataURL(file);
            }
          });

          return true;
        }
        return false;
      },
    },
  });

  // Sync content if value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML() && value !== lastEmittedValue.current) {
      editor.commands.setContent(value);
      setCharacterCount(editor.storage.characterCount.characters());
    }
  }, [value, editor]);

  // Initial character count
  useEffect(() => {
    if (editor) {
      setCharacterCount(editor.storage.characterCount.characters());
    }
  }, [editor]);

  // Update AI extension "enabled" dynamically
  useEffect(() => {
    if (editor) {
      const aiExt = editor.extensionManager.extensions.find(e => e.name === 'aiAutocomplete');
      if (aiExt) {
        aiExt.options.enabled = aiEnabled;
      }
    }
  }, [editor, aiEnabled]);

  return (
    <div className={`w-full relative notion-editor-container ${className}`} ref={containerRef}>
      {/* Non-sticky Top Toolbar */}
      <MenuBar editor={editor} />

      <div className="flex w-full relative">
        <div className="notion-editor flex-1 min-w-0 relative">
          <EditorContent editor={editor} />
          {editor && (
            <>
              <FloatingToolbar editor={editor} aiEnabled={aiEnabled} />
              <SlashMenu editor={editor} />
              <BlockHandle editor={editor} />
              <TableContextMenu editor={editor} />
              <TableEdgeMenu editor={editor} />
            </>
          )}
        </div>

        {/* Table of Contents sidebar */}
        <TableOfContents editor={editor} />
      </div>

      {/* Footer */}
      <div className="editor-footer flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground/60 w-full">
        <span className="uppercase tracking-widest text-[10px] font-semibold">
          Rich Text Editor
        </span>
        {editor && (
          <span className="flex items-center gap-2">
            <span>{editor.storage.characterCount.words()} words</span>
            <span>·</span>
            <span>{characterCount} characters</span>
          </span>
        )}
      </div>
    </div>
  );
});

RichEditor.displayName = 'RichEditor';
