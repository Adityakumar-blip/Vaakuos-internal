import { cn } from '@/lib/utils';
import { modulesUnset, type ModuleSlot } from './modules';

interface ModuleRosterProps {
    slots: ModuleSlot[];
    className?: string;
}

/**
 * Named module list for hover cards and the brand licence drawer.
 * Same slot order as ModuleStrip, so a gap in the strip maps to a row here.
 */
export function ModuleRoster({ slots, className }: ModuleRosterProps) {
    if (slots.length === 0) {
        return <p className="text-xs text-muted-foreground">No modules in the catalogue yet.</p>;
    }

    if (modulesUnset(slots)) {
        return (
            <p className="text-xs text-muted-foreground leading-relaxed">
                Modules have not been set on this licence, so every gate still fails open.
            </p>
        );
    }

    const granted = slots.filter((s) => s.state === 'granted').length;

    return (
        <div className={cn('space-y-2', className)}>
            <p className="text-[11px] text-muted-foreground tabular-nums">
                {granted} of {slots.length} granted
            </p>
            <ul className="grid grid-cols-1 gap-1">
                {slots.map((s) => (
                    <li key={s.key} className="flex items-center gap-2 text-xs min-w-0">
                        <span
                            className={cn(
                                'h-1.5 w-1.5 rounded-full shrink-0',
                                s.state === 'granted' &&
                                    (s.overridden
                                        ? 'bg-[hsl(var(--brand-secondary))]'
                                        : 'bg-primary'),
                                s.state === 'locked' && 'bg-transparent ring-1 ring-inset ring-border',
                                s.state === 'unset' && 'bg-muted-foreground/30',
                            )}
                        />
                        <span
                            className={cn(
                                'truncate',
                                s.state === 'locked' && 'text-muted-foreground line-through decoration-border',
                                s.state === 'unset' && 'text-muted-foreground',
                            )}
                        >
                            {s.label}
                        </span>
                        {s.overridden && (
                            <span className="ml-auto shrink-0 text-[10px] text-[hsl(var(--brand-secondary))]">
                                override
                            </span>
                        )}
                        {s.state === 'locked' && (
                            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                                locked
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
