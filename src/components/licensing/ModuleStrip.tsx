import { cn } from '@/lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { modulesUnset, type ModuleSlot } from './modules';
import { ModuleRoster } from './ModuleRoster';

interface ModuleStripProps {
    slots: ModuleSlot[];
    /** `full` prints the count alongside; `bare` suits dense table rows. */
    variant?: 'bare' | 'full';
    className?: string;
}

/**
 * A licence's module composition as a fixed row of slots, in the same order
 * everywhere — so two licences compare by eye and a gap reads as a difference.
 *
 * Three states, because a strip that draws "not decided" as "granted" makes a
 * free plan look identical to the top tier. When nothing has been decided the
 * strip says so in words: eleven identical ghosts are not self-explanatory.
 */
export function ModuleStrip({ slots, variant = 'bare', className }: ModuleStripProps) {
    if (slots.length === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    const unset = modulesUnset(slots);
    const granted = slots.filter((s) => s.state === 'granted');

    const summary = unset
        ? 'Modules not set on this licence'
        : `${granted.length} of ${slots.length} modules: ${
              granted.map((s) => s.label).join(', ') || 'none'
          }`;

    const strip = (
        <div className={cn('flex items-center gap-2', className)}>
            <div className="flex items-center gap-[3px]" role="img" aria-label={summary}>
                {slots.map((s) => (
                    <span
                        key={s.key}
                        className={cn(
                            'h-4 w-1.5 rounded-sm',
                            s.state === 'granted' &&
                                (s.overridden ? 'bg-[hsl(var(--brand-secondary))]' : 'bg-primary'),
                            s.state === 'locked' && 'bg-transparent ring-1 ring-inset ring-border',
                            s.state === 'unset' && 'bg-muted-foreground/20',
                        )}
                    />
                ))}
            </div>

            {unset ? (
                <span className="text-[11px] text-muted-foreground">not set</span>
            ) : (
                variant === 'full' && (
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                        {granted.length}/{slots.length}
                    </span>
                )
            )}
        </div>
    );

    return (
        <HoverCard openDelay={180} closeDelay={80}>
            <HoverCardTrigger asChild>
                <button
                    type="button"
                    className="rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={(e) => e.stopPropagation()}
                >
                    {strip}
                </button>
            </HoverCardTrigger>
            <HoverCardContent align="start" className="w-64 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Modules
                </p>
                <ModuleRoster slots={slots} />
            </HoverCardContent>
        </HoverCard>
    );
}
