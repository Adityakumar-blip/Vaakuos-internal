import { Extension, Editor } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  command: (props: { editor: Editor; range: { from: number; to: number } }) => void;
}

export const SlashCommandPluginKey = new PluginKey('slashCommand');

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: SlashCommandPluginKey,
        state: {
          init() {
            return { active: false, range: null as { from: number; to: number } | null, query: '' };
          },
          apply(tr, prev) {
            const meta = tr.getMeta(SlashCommandPluginKey);
            if (meta) return meta;

            if (!prev.active) return prev;

            // If the selection changed or document changed while slash is active, update the query
            if (tr.docChanged || tr.selectionSet) {
              // Use the NEW document's selection to find the cursor position
              const headPos = tr.selection?.head ?? (tr.steps.length > 0 ? tr.mapping.map(prev.range!.to) : prev.range!.to);
              const $head = tr.doc.resolve(headPos);
              const textBefore = $head.parent.textContent.slice(0, $head.parentOffset);
              const slashIndex = textBefore.lastIndexOf('/');

              if (slashIndex === -1) {
                return { active: false, range: null, query: '' };
              }

              const query = textBefore.slice(slashIndex + 1);

              // Close the menu if the user types a space (they're done searching)
              if (query.includes(' ')) {
                return { active: false, range: null, query: '' };
              }

              return {
                active: true,
                range: { from: $head.start() + slashIndex, to: $head.pos },
                query,
              };
            }

            return prev;
          },
        },
        props: {
          handleKeyDown(view, event) {
            const state = SlashCommandPluginKey.getState(view.state);

            if (event.key === '/' && !state?.active) {
              // Will be handled by input rules - let it through
              return false;
            }

            if (state?.active) {
              if (event.key === 'Escape') {
                view.dispatch(
                  view.state.tr.setMeta(SlashCommandPluginKey, {
                    active: false,
                    range: null,
                    query: '',
                  })
                );
                return true;
              }

              // Arrows and Enter are handled by the React menu component
              if (['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
                return true; // Let React handle via event listener, and prevent Tiptap from inserting newline
              }
            }

            return false;
          },

          handleTextInput(view, from, to, text) {
            if (text === '/') {
              const $from = view.state.doc.resolve(from);
              const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

              // Only trigger at start of line or after a space
              if (textBefore.length === 0 || textBefore.endsWith(' ')) {
                setTimeout(() => {
                  view.dispatch(
                    view.state.tr.setMeta(SlashCommandPluginKey, {
                      active: true,
                      range: { from, to: from + 1 },
                      query: '',
                    })
                  );
                }, 0);
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});
