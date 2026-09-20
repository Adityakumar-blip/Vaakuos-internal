import { toast } from 'sonner';
import { AlertTriangle, Loader2, Plug, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { formatDate, formatDateTime } from '@/utils/format';
import {
    useCreateIntegrationCatalogMutation,
    useGetIntegrationIncidentsQuery,
    useGetIntegrationStatsQuery,
    useToggleIntegrationMutation,
} from '@/store/api/integrationCatalogApi';
import {
    IMPLEMENTATION_LABELS,
    STATUS_LABELS,
    type IntegrationStatus,
    type ManagedPlugin,
    type PluginIncident,
    type PluginUsageStats,
} from './types';

const STATUS_TONE: Record<IntegrationStatus, 'success' | 'warning' | 'danger' | 'info'> = {
    operational: 'success',
    degraded: 'warning',
    down: 'danger',
    maintenance: 'info',
};

function statsFromCatalog(plugin: ManagedPlugin): Partial<PluginUsageStats> {
    const row = plugin.catalog;
    if (!row) return {};
    return {
        connected_tenants: row.connected_tenants,
        error_count_24h: row.error_count_24h,
        last_error: row.last_error,
        last_error_at: row.last_error_at,
        last_checked_at: row.last_checked_at,
        last_sync_at: row.last_sync_at,
    };
}

function openIncidentFromCatalog(plugin: ManagedPlugin): PluginIncident | null {
    const row = plugin.catalog;
    if (!row || row.status === 'operational') return null;
    return {
        id: `${row.id}-open`,
        status: row.status,
        message: row.status_message || 'No message recorded.',
        started_at: row.updated_at || row.created_at || new Date().toISOString(),
        resolved_at: null,
    };
}

export function PluginInspector({
    plugin,
    onClose,
    onManage,
}: {
    plugin: ManagedPlugin | null;
    onClose: () => void;
    onManage: () => void;
}) {
    const catalogId = plugin?.catalog?.id;
    const [publish, { isLoading: isPublishing }] = useCreateIntegrationCatalogMutation();
    const [toggle, { isLoading: isToggling }] = useToggleIntegrationMutation();

    const { data: remoteStats, isError: statsMissing } = useGetIntegrationStatsQuery(catalogId ?? '', {
        skip: !catalogId,
    });
    const { data: remoteIncidents, isError: incidentsMissing } = useGetIntegrationIncidentsQuery(
        catalogId ?? '',
        { skip: !catalogId },
    );

    if (!plugin) return null;

    const row = plugin.catalog;
    const listStats = statsFromCatalog(plugin);
    const stats: Partial<PluginUsageStats> = { ...listStats, ...remoteStats };
    const incidents =
        remoteIncidents && remoteIncidents.length > 0
            ? remoteIncidents
            : openIncidentFromCatalog(plugin)
              ? [openIncidentFromCatalog(plugin)!]
              : [];

    const handlePublish = async () => {
        try {
            await publish({
                provider: plugin.provider,
                name: plugin.name,
                description: plugin.description,
                category: plugin.category,
                is_enabled: false,
                status: 'operational',
                config_fields: [],
            }).unwrap();
            toast.success(`${plugin.name} is now in the catalog — you can offer it and track issues.`);
        } catch {
            toast.error(`Could not add ${plugin.name} to the catalog. Check that POST /integration-catalog exists.`);
        }
    };

    const handleToggle = async () => {
        if (!row) return;
        try {
            await toggle(row.id).unwrap();
            toast.success(`${plugin.name} ${row.is_enabled ? 'withdrawn from' : 'offered to'} all tenants`);
        } catch {
            toast.error(`Could not update ${plugin.name}`);
        }
    };

    return (
        <Sheet open={!!plugin} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
                <SheetHeader className="text-left pr-6">
                    <SheetTitle>{plugin.name}</SheetTitle>
                    <SheetDescription>
                        <code className="text-xs">{plugin.provider}</code>
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-5 space-y-5">
                    <div className="flex flex-wrap gap-2">
                        <Pill tone={row ? 'success' : 'neutral'} size="sm" dot>
                            {row ? 'In catalog' : 'Not in catalog'}
                        </Pill>
                        <Pill
                            tone={
                                plugin.implementation === 'wired'
                                    ? 'primary'
                                    : plugin.implementation === 'in_progress'
                                      ? 'warning'
                                      : 'orange'
                            }
                            size="sm"
                        >
                            {IMPLEMENTATION_LABELS[plugin.implementation]}
                        </Pill>
                        {row && (
                            <Pill tone={STATUS_TONE[row.status]} size="sm" dot>
                                {STATUS_LABELS[row.status]}
                            </Pill>
                        )}
                        {row && (
                            <Pill tone={row.is_enabled ? 'success' : 'neutral'} size="sm">
                                {row.is_enabled ? 'Offered' : 'Withdrawn'}
                            </Pill>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {plugin.description || 'No description yet.'}
                    </p>

                    {!row && (
                        <div className="rounded-lg border border-dashed bg-muted/30 p-4 space-y-3">
                            <p className="text-sm">
                                This plugin is declared in the VaakuOS app but has no catalog row, so
                                tenants cannot be gated and issues cannot be recorded. Add it to the
                                catalog to control offer, status and incidents.
                            </p>
                            <Button onClick={handlePublish} disabled={isPublishing}>
                                {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add to catalog
                            </Button>
                        </div>
                    )}

                    {row && (
                        <>
                            {row.status !== 'operational' && row.status_message && (
                                <p className="flex gap-2 rounded-md bg-destructive/5 p-3 text-sm text-destructive">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    {row.status_message}
                                </p>
                            )}

                            <section>
                                <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                                    Usage
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <StatBox
                                        label="Connected tenants"
                                        value={formatCount(stats.connected_tenants)}
                                    />
                                    <StatBox
                                        label="Errors (24h)"
                                        value={formatCount(stats.error_count_24h)}
                                        alert={(stats.error_count_24h ?? 0) > 0}
                                    />
                                    <StatBox
                                        label="Last check"
                                        value={stats.last_checked_at ? formatDateTime(stats.last_checked_at) : '—'}
                                    />
                                    <StatBox
                                        label="Last sync"
                                        value={stats.last_sync_at ? formatDateTime(stats.last_sync_at) : '—'}
                                    />
                                </div>
                                {statsMissing && (
                                    <p className="text-[11px] text-muted-foreground mt-2">
                                        Live stats endpoint is not reporting yet. Counts shown come from
                                        the catalog row when present.
                                    </p>
                                )}
                                {stats.last_error && (
                                    <p className="mt-2 text-xs text-destructive">
                                        Last error{stats.last_error_at ? ` · ${formatDateTime(stats.last_error_at)}` : ''}:{' '}
                                        {stats.last_error}
                                    </p>
                                )}
                            </section>

                            <section>
                                <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                                    Issues
                                </h3>
                                {incidents.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No open or recorded incidents.
                                        {incidentsMissing &&
                                            ' Incident history is not available from the API yet — current status is shown on the card.'}
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {incidents.map((incident) => (
                                            <li
                                                key={incident.id}
                                                className="rounded-md border border-border px-3 py-2 space-y-1"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <Pill tone={STATUS_TONE[incident.status]} size="xs" dot>
                                                        {STATUS_LABELS[incident.status]}
                                                    </Pill>
                                                    <span className="text-[11px] text-muted-foreground tabular-nums">
                                                        {incident.resolved_at
                                                            ? `Resolved ${formatDate(incident.resolved_at)}`
                                                            : `Open since ${formatDate(incident.started_at)}`}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{incident.message}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>

                            <section>
                                <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                                    Connection fields
                                </h3>
                                {row.config_fields.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No tenant credentials required.
                                    </p>
                                ) : (
                                    <ul className="text-sm space-y-1">
                                        {row.config_fields.map((field) => (
                                            <li key={field.key} className="flex items-center justify-between gap-2">
                                                <span>{field.label || field.key}</span>
                                                <span className="text-[11px] font-mono text-muted-foreground">
                                                    {field.type}
                                                    {field.required ? ' · required' : ''}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>

                            <Separator />

                            <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div>
                                    <dt>Created</dt>
                                    <dd className="text-foreground tabular-nums">{formatDateTime(row.created_at)}</dd>
                                </div>
                                <div>
                                    <dt>Updated</dt>
                                    <dd className="text-foreground tabular-nums">{formatDateTime(row.updated_at)}</dd>
                                </div>
                            </dl>
                        </>
                    )}
                </div>

                <SheetFooter className="mt-6 flex-col sm:flex-col gap-2">
                    {row && (
                        <>
                            <Button variant="outline" className="w-full" onClick={onManage}>
                                <Settings2 className="mr-2 h-4 w-4" />
                                Manage status and fields
                            </Button>
                            <Button
                                className="w-full"
                                variant={row.is_enabled ? 'outline' : 'default'}
                                onClick={handleToggle}
                                disabled={isToggling}
                            >
                                {isToggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {row.is_enabled ? 'Withdraw from tenants' : 'Offer to tenants'}
                            </Button>
                        </>
                    )}
                    {!row && (
                        <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
                            <Plug className="h-3.5 w-3.5" />
                            Catalog control unlocks offer, status and issue tracking.
                        </p>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function formatCount(value: number | undefined) {
    return typeof value === 'number' ? String(value) : '—';
}

function StatBox({
    label,
    value,
    alert,
}: {
    label: string;
    value: string;
    alert?: boolean;
}) {
    return (
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className={cn('text-sm font-medium tabular-nums mt-0.5', alert && 'text-destructive')}>
                {value}
            </p>
        </div>
    );
}
