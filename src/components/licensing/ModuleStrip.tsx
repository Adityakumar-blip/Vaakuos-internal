import { cn } from '@/lib/utils';
import { modulesUnset, type ModuleSlot } from './modules';

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

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div className="flex items-center gap-[2px]" role="img" aria-label={summary}>
                {slots.map((s) => (
                    <span
                        key={s.key}
                        title={
                            s.state === 'unset'
                                ? `${s.label} — not set`
                                : `${s.label}${s.state === 'locked' ? ' — locked' : ''}${
                                      s.overridden ? ' (override)' : ''
                                  }`
                        }
                        className={cn(
                            'h-3 w-[6px] rounded-[1px]',
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
}
