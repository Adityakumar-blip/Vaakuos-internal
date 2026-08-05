import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { askAI } from '../../../services/aiService';

export const AiAutocompletePluginKey = new PluginKey('aiAutocomplete');

export interface AiAutocompleteOptions {
  debounceTime: number;
  enabled?: boolean;
}

export const AiAutocomplete = Extension.create<AiAutocompleteOptions>({
  name: 'aiAutocomplete',

  addOptions() {
    return {
      debounceTime: 500,
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    let timeoutId: NodeJS.Timeout | null = null;
    let isFetching = false;
    let currentSuggestion = '';
    let suggestionPosition = 0;

    return [
      new Plugin({
        key: AiAutocompletePluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, decorationSet) => {
            if (tr.docChanged) {
               currentSuggestion = '';
               return DecorationSet.empty;
            }
            
            const set = decorationSet.map(tr.mapping, tr.doc);

            if (currentSuggestion && tr.selection.empty) {
                const pos = tr.selection.from;
                if (pos === suggestionPosition) {
                    const decoration = Decoration.widget(pos, () => {
                        const span = document.createElement('span');
                        span.textContent = currentSuggestion;
                        span.className = 'text-muted-foreground/40 italic pointer-events-none select-none';
                        return span;
                    });
                    return DecorationSet.create(tr.doc, [decoration]);
                } else {
                     currentSuggestion = '';
                     return DecorationSet.empty;
                }
            }

            return set;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
          handleKeyDown: (view, event) => {
            if (event.key === 'Tab' && currentSuggestion) {
              event.preventDefault(); 
              
              const pos = view.state.selection.from;
              const textToInsert = currentSuggestion;
              currentSuggestion = ''; 
              
              view.dispatch(
                  view.state.tr
                      .insertText(textToInsert, pos)
                      .scrollIntoView()
              );
              return true; 
            }
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Enter'].includes(event.key) || event.key.length === 1) {
                if (currentSuggestion) {
                     currentSuggestion = '';
                     view.dispatch(view.state.tr.setMeta('aiAutocomplete', 'clear'));
                }
            }
            return false;
          },
        },
        view: () => {
          return {
            update: (view, prevState) => {
              if (!this.options.enabled) return;
              
              if (!view.state.doc.eq(prevState.doc)) {
                  if (timeoutId) clearTimeout(timeoutId);
                  
                  const { $from, empty } = view.state.selection;
                  // Don't auto-complete inside code blocks or if selection is not empty
                  if (!empty || $from.parent.type.name === 'codeBlock') return;
                  
                  const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
                  const textAfter = $from.parent.textContent.slice($from.parentOffset);
                  
                  // Only autocomplete at the end of the text
                  if (textAfter.length > 0) return; 
                  
                  // Need a minimum number of words for context
                  if (textBefore.trim().split(' ').length < 2) return;

                  timeoutId = setTimeout(async () => {
                    if (isFetching) return;
                    isFetching = true;
                    
                    try {
                        const action: { type: 'custom', prompt: string } = { type: 'custom', prompt: 'Continue the sentence naturally. Provide ONLY the continuation text, without quotes or explanations.' };
                        
                        const docBefore = view.state.doc.textBetween(
                            Math.max(0, $from.pos - 200),
                            $from.pos,
                            '\n'
                        );
                        
                        const suggestion = await askAI(textBefore.trim(), action, docBefore);
                        
                        if (suggestion) {
                            currentSuggestion = suggestion;
                            suggestionPosition = view.state.selection.from;
                            
                            if (view.state.selection.from === suggestionPosition) {
                                view.dispatch(view.state.tr.setMeta('aiAutocomplete', 'show'));
                            } else {
                                currentSuggestion = '';
                            }
                        }
                    } catch (e) {
                        console.error('AI Autocomplete error:', e);
                    } finally {
                        isFetching = false;
                    }
                  }, this.options.debounceTime);
              }
            }
          };
        }
      }),
    ];
  },
});
