export const KEYBOARD_SHORTCUTS = {
    TOGGLE_SIDEBAR: 'ctrl+b',
} as const;

export type KeyboardShortcut = typeof KEYBOARD_SHORTCUTS[keyof typeof KEYBOARD_SHORTCUTS];
