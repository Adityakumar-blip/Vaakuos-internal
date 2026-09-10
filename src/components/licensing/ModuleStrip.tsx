import { cn } from '@/lib/utils';
import type { ModuleSlot } from './modules';

interface ModuleStripProps {
    slots: ModuleSlot[];
    /** `full` also prints the count; `bare` suits dense table rows. */
    variant?: 'bare' | 'full';
    className?: string;
}

/**
 * A licence's module composition as a fixed row of slots — filled where the
 * module is granted, hollow where it is locked. Otherwise reading a licence
 * means parsing a JSON blob, and comparing two is impossible at a glance.
 */
export function ModuleStrip({ slots, variant = 'bare', className }: ModuleStripProps) {
    if (slots.length === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    const grantedSlots = slots.filter((s) => s.granted);
    const summary = `${grantedSlots.length} of ${slots.length} modules: ${
        grantedSlots.map((s) => s.label).join(', ') || 'none'
    }`;

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div className="flex items-center gap-[3px]" role="img" aria-label={summary}>
                {slots.map((s) => (
                    <span
                        key={s.key}
                        title={`${s.label}${s.granted ? '' : ' — locked'}${s.overridden ? ' (override)' : ''}`}
                        className={cn(
                            'h-4 w-[7px] rounded-[2px]',
                            s.granted
                                ? s.overridden
                                    ? 'bg-[hsl(var(--brand-secondary))]'
                                    : 'bg-primary'
                                : 'bg-transparent ring-1 ring-inset ring-border',
                        )}
                    />
                ))}
            </div>
            {variant === 'full' && (
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {grantedSlots.length}/{slots.length}
                </span>
            )}
        </div>
    );
}
