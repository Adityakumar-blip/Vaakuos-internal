import { useState } from 'react';
import { Shortcut } from './Shortcut';
import { Kbd } from './Kbd';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icons } from '@/components/Icons';

interface ShortcutHelpProps {
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

/**
 * Common component to show a shortcut help modal.
 * Triggered by '?' key.
 */
export const ShortcutHelp = ({ shortcuts }: ShortcutHelpProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Shortcut keys="?" action={() => setIsOpen(true)} />
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background/80 backdrop-blur-2xl border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Icons.Dashboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-transparent hover:border-border/50 transition-all">
                <span className="text-sm font-medium">{s.description}</span>
                <Kbd keys={s.keys} />
              </div>
            ))}
          </div>
          <div className="text-[10px] text-center text-muted-foreground pt-4 border-t border-border/50">
            Press <kbd className="font-sans font-bold">ESC</kbd> to close
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
