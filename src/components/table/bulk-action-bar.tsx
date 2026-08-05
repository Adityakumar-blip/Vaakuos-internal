import React from 'react';
import { XMarkIcon as X, ChevronDownIcon as ChevronDown } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BulkAction } from '../ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';

interface BulkActionBarProps<TData> {
    selectedCount: number;
    totalCount: number;
    actions: BulkAction<TData>[];
    onClearSelection: () => void;
    onActionClick: (action: BulkAction<TData>) => void;
}

export function BulkActionBar<TData>({
    selectedCount,
    totalCount,
    actions,
    onClearSelection,
    onActionClick,
}: BulkActionBarProps<TData>) {
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedCount > 0) {
                onClearSelection();
                return;
            }

            if (selectedCount > 0) {
                const action = actions.find(a => a.shortcut && a.shortcut.toLowerCase() === e.key.toLowerCase());
                if (action) {
                    e.preventDefault();
                    onActionClick(action);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedCount, onClearSelection, actions, onActionClick]);

    if (selectedCount === 0) return null;

    return (
        <div 
            role="toolbar" 
            aria-label="Bulk actions"
            className="flex items-center justify-between gap-4 px-4 py-2 bg-primary/5 border border-primary/20 rounded-md animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm"
        >
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 pr-4 border-r border-primary/20">
                    <span className="text-sm font-semibold text-primary">
                        {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearSelection}
                        className="h-7 px-2 text-xs text-primary hover:bg-primary/10 transition-colors"
                    >
                        Deselect all
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 border-primary/20 bg-background hover:bg-primary/5 hover:text-primary transition-all shadow-none font-medium"
                            >
                                Actions
                                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-52 p-1.5 shadow-xl border-primary/10">
                            {actions.map((action, index) => (
                                <React.Fragment key={index}>
                                    <DropdownMenuItem
                                        onClick={() => onActionClick(action)}
                                        className={cn(
                                            "flex items-center gap-2.5 px-2.5 py-2 rounded-sm cursor-pointer transition-colors",
                                            action.variant === 'destructive' 
                                                ? "text-destructive focus:bg-destructive/10 focus:text-destructive" 
                                                : "text-foreground focus:bg-primary/5 focus:text-primary"
                                        )}
                                    >
                                        {action.icon && <span className="w-4 h-4 opacity-70 group-focus:opacity-100">{action.icon}</span>}
                                        <span className="flex-1 font-medium">{action.label}</span>
                                        {action.shortcut && (
                                            <DropdownMenuShortcut className="opacity-40 font-mono text-[10px] uppercase tracking-wider">
                                                {action.shortcut}
                                            </DropdownMenuShortcut>
                                        )}
                                    </DropdownMenuItem>
                                    {index < actions.length - 1 && action.variant !== actions[index + 1]?.variant && (
                                        <DropdownMenuSeparator className="my-1 bg-primary/5" />
                                    )}
                                </React.Fragment>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={onClearSelection}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all hover:rotate-90"
            >
                <X className="w-4 h-4" />
            </Button>
        </div>
    );
}
