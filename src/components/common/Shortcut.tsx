import { useEffect } from 'react';

interface ShortcutProps {
  keys: string; // e.g. "t", "ctrl+s"
  action: () => void;
  description?: string;
  disabled?: boolean;
}

/**
 * Common component to handle keyboard shortcuts.
 * Automatically handles cleanup and prevents defaults.
 */
export const Shortcut = ({ keys, action, disabled }: ShortcutProps) => {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const pressedKeys = [];
      if (event.ctrlKey || event.metaKey) pressedKeys.push('ctrl');
      if (event.shiftKey) pressedKeys.push('shift');
      if (event.altKey) pressedKeys.push('alt');
      pressedKeys.push(event.key.toLowerCase());

      const shortcutStr = pressedKeys.join('+');

      if (shortcutStr === keys.toLowerCase()) {
        event.preventDefault();
        action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keys, action, disabled]);

  return null; // This is a logic-only component
};
