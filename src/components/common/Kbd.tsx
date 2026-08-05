import React from 'react';
import { cn } from '@/lib/utils';

interface KbdProps {
  keys: string[];
  className?: string;
}

/**
 * Kbd component to display keyboard shortcuts visually.
 * Usage: <Kbd keys={['ctrl', 't']} />
 */
export const Kbd = ({ keys, className }: KbdProps) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <kbd className="inline-flex items-center justify-center px-1.5 h-5 min-w-[20px] text-[10px] font-medium text-muted-foreground bg-muted border border-border rounded-md shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
            {key === 'ctrl' ? '⌘' : key === 'shift' ? '⇧' : key === 'alt' ? '⌥' : key.toUpperCase()}
          </kbd>
          {index < keys.length - 1 && <span className="text-[10px] text-muted-foreground">+</span>}
        </React.Fragment>
      ))}
    </div>
  );
};
