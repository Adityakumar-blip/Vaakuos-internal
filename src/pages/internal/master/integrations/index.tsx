import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    AlertTriangle,
    ExternalLink,
    KeyRound,
    Plug,
    Plus,
    Search,
    Settings2,
    Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Pill } from '@/components/ui/pill';
import { cn } from '@/lib/utils';
import {
    useGetIntegrationCatalogQuery,
    useToggleIntegrationMutation,
    useUpdateIntegrationCatalogMutation,
    useUpdateIntegrationStatusMutation,
} from '@/store/api/integrationCatalogApi';
import {
    CATEGORY_LABELS,
    CONFIG_FIELD_TYPES,
    IMPLEMENTATION_LABELS,
    INTEGRATION_CATEGORIES,
    INTEGRATION_STATUSES,
    STATUS_LABELS,
    type ConfigField,
    type IntegrationCatalogEntry,
    type IntegrationCategory,
    type IntegrationStatus,
    type ManagedPlugin,
} from './types';
import { mergePlugins } from './mergePlugins';
import { PluginInspector } from './PluginInspector';

const STATUS_STYLES: Record<IntegrationStatus, { dot: string; text: string }> = {
    operational: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
    degraded: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
    down: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
    maintenance: { dot: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400' },
};

const ALL = 'all';
type Slice = 'all' | 'offered' | 'undeclared' | 'incidents';

export default function IntegrationsPage() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string>(ALL);
    const [status, setStatus] = useState<string>(ALL);
    const [slice, setSlice] = useState<Slice>('all');
    const [editing, setEditing] = useState<IntegrationCatalogEntry | null>(null);
    const [inspecting, setInspecting] = useState<ManagedPlugin | null>(null);

    const { data: catalog = [], isLoading } = useGetIntegrationCatalogQuery();
    const [toggleIntegration] = useToggleIntegrationMutation();

    const plugins = useMemo(() => mergePlugins(catalog), [catalog]);

    useEffect(() => {
        if (!inspecting) return;
        const next = plugins.find((p) => p.provider === inspecting.provider);
        if (!next) return;
        const before = inspecting.catalog;
        const after = next.catalog;
        if (before?.id !== after?.id || before?.updated_at !== after?.updated_at || before?.is_enabled !== after?.is_enabled) {
            setInspecting(next);
        }
    }, [plugins, inspecting]);

    const stats = useMemo(() => {
        const inCatalog = plugins.filter((p) => p.catalog).length;
        const offered = plugins.filter((p) => p.catalog?.is_enabled).length;
        const undeclared = plugins.filter((p) => !p.catalog).length;
        const incidents = plugins.filter(
            (p) => p.catalog && p.catalog.status !== 'operational',
        ).length;
        const connected = plugins.reduce(
            (sum, p) => sum + (p.catalog?.connected_tenants ?? 0),
            0,
        );
        const hasConnectedMetric = plugins.some(
            (p) => typeof p.catalog?.connected_tenants === 'number',
        );
        return { total: plugins.length, inCatalog, offered, undeclared, incidents, connected, hasConnectedMetric };
    }, [plugins]);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        return plugins.filter((item) => {
            if (slice === 'offered' && !item.catalog?.is_enabled) return false;
            if (slice === 'undeclared' && item.catalog) return false;
            if (slice === 'incidents' && item.catalog?.status === 'operational') return false;
            if (slice === 'incidents' && !item.catalog) return false;
            if (category !== ALL && item.category !== category) return false;
            if (status !== ALL && item.catalog?.status !== status) return false;
            if (
                term &&
                !item.name.toLowerCase().includes(term) &&
                !item.provider.toLowerCase().includes(term)
            ) {
                return false;
            }
            return true;
        });
    }, [plugins, search, category, status, slice]);

    const sections = useMemo(
        () =>
            INTEGRATION_CATEGORIES.map((key) => ({
                key,
                items: visible.filter((item) => item.category === key),
            })).filter((section) => section.items.length > 0),
        [visible],
    );

    const isFiltered =
        search.trim() !== '' || category !== ALL || status !== ALL || slice !== 'all';

    const handleToggle = async (item: ManagedPlugin) => {
        if (!item.catalog) {
            setInspecting(item);
            return;
        }
        try {
            await toggleIntegration(item.catalog.id).unwrap();
            toast.success(
                `${item.name} ${item.catalog.is_enabled ? 'withdrawn from' : 'offered to'} all tenants`,
            );
        } catch {
            toast.error(`Could not update ${item.name}`);
        }
    };

    const resetFilters = () => {
        setSearch('');
        setCategory(ALL);
        setStatus(ALL);
        setSlice('all');
    };

    return (
        <div className="space-y-6 pt-4">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
                <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
                    Catalog control for every VaakuOS plugin — including ones the tenant app still
                    only declares in the frontend. Offer them, publish outages, and inspect usage
                    and issues from one place.
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {(
                    [
                        { id: 'all' as const, label: 'Known plugins', value: stats.total, hint: 'Catalog + app-declared' },
                        { id: 'offered' as const, label: 'Offered', value: `${stats.offered} of ${stats.inCatalog}`, hint: 'Visible to tenants' },
                        {
                            id: 'undeclared' as const,
                            label: 'Not in catalog',
                            value: stats.undeclared,
                            hint: 'Frontend-only — add to control',
                        },
                        {
                            id: 'incidents' as const,
                            label: 'Open incidents',
                            value: stats.incidents,
                            hint: 'Degraded, down or maintenance',
                        },
                    ] as const
                ).map((tile) => (
                    <button
                        key={tile.id}
                        type="button"
                        onClick={() => setSlice(tile.id)}
                        className={cn(
                            'text-left rounded-xl border bg-card px-4 py-3.5 transition-colors',
                            'hover:border-primary/40 hover:bg-muted/30',
                            slice === tile.id
                                ? 'border-primary ring-1 ring-primary/30 bg-primary/[0.04]'
                                : 'border-border',
                        )}
                    >
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{tile.label}</p>
                        <p
                            className={cn(
                                'mt-1 text-2xl font-semibold tabular-nums',
                                tile.id === 'incidents' && stats.incidents > 0 && 'text-red-500',
                                tile.id === 'undeclared' && stats.undeclared > 0 && 'text-amber-600 dark:text-amber-400',
                            )}
                        >
                            {isLoading ? '—' : tile.value}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">{tile.hint}</p>
                    </button>
                ))}
                <div className="rounded-xl border border-border bg-card px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Connected tenants
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                        {isLoading ? '—' : stats.hasConnectedMetric ? stats.connected : '—'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                        {stats.hasConnectedMetric
                            ? 'Sum across catalog rows'
                            : 'API does not send usage yet'}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-5 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or provider code..."
                        className="pl-9"
                    />
                </div>
                <div className="shrink-0 sm:w-48">
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All categories</SelectItem>
                            {INTEGRATION_CATEGORIES.map((value) => (
                                <SelectItem key={value} value={value}>
                                    {CATEGORY_LABELS[value]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="shrink-0 sm:w-44">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All statuses</SelectItem>
                            {INTEGRATION_STATUSES.map((value) => (
                                <SelectItem key={value} value={value}>
                                    {STATUS_LABELS[value]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                </div>
            ) : sections.length === 0 ? (
                <EmptyState isFiltered={isFiltered} onReset={resetFilters} />
            ) : (
                <div className="space-y-8">
                    {sections.map((section) => (
                        <section key={section.key} className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                    {CATEGORY_LABELS[section.key as IntegrationCategory]}
                                </h2>
                                <span className="text-xs text-muted-foreground/60">
                                    {section.items.length}
                                </span>
                                <div className="h-px flex-1 bg-border" />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {section.items.map((item) => (
                                    <IntegrationCard
                                        key={item.provider}
                                        plugin={item}
                                        onToggle={() => handleToggle(item)}
                                        onManage={() => {
                                            if (item.catalog) setEditing(item.catalog);
                                            else setInspecting(item);
                                        }}
                                        onInspect={() => setInspecting(item)}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <PluginInspector
                plugin={inspecting}
                onClose={() => setInspecting(null)}
                onManage={() => {
                    if (inspecting?.catalog) {
                        setEditing(inspecting.catalog);
                        setInspecting(null);
                    }
                }}
            />
            <ManageDialog integration={editing} onClose={() => setEditing(null)} />
        </div>
    );
}

function EmptyState({
    isFiltered,
    onReset,
}: {
    isFiltered: boolean;
    onReset: () => void;
}) {
    return (
        <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Plug className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-medium">
                {isFiltered ? 'No plugins match these filters' : 'No plugins to show'}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {isFiltered
                    ? 'Try a different category, status or slice.'
                    : 'Catalog rows come from the backend; app-declared plugins are listed even before they are seeded.'}
            </p>
            {isFiltered && (
                <Button variant="outline" size="sm" className="mt-4" onClick={onReset}>
                    Clear filters
                </Button>
            )}
        </div>
    );
}

function IntegrationCard({
    plugin,
    onToggle,
    onManage,
    onInspect,
}: {
    plugin: ManagedPlugin;
    onToggle: () => void;
    onManage: () => void;
    onInspect: () => void;
}) {
    const row = plugin.catalog;
    const statusStyle = row ? STATUS_STYLES[row.status] : STATUS_STYLES.operational;
    const requiredCount = row?.config_fields.filter((f) => f.required).length ?? 0;
    const inCatalog = !!row;

    return (
        <Card
            className={cn(
                'flex flex-col transition-colors cursor-pointer',
                (!inCatalog || !row.is_enabled) && 'border-dashed bg-muted/30',
            )}
            onClick={onInspect}
        >
            <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
                <div
                    className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-sm font-semibold uppercase',
                        (!inCatalog || !row.is_enabled) && 'opacity-50',
                    )}
                >
                    {row?.icon_url ? (
                        <img src={row.icon_url} alt="" className="h-full w-full object-contain p-1.5" />
                    ) : (
                        plugin.name.slice(0, 2)
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <h3 className="truncate font-semibold leading-tight">{plugin.name}</h3>
                        {row?.docs_url && (
                            <a
                                href={row.docs_url}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 text-muted-foreground hover:text-foreground"
                                aria-label={`${plugin.name} documentation`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        )}
                    </div>
                    <code className="text-xs text-muted-foreground">{plugin.provider}</code>
                </div>
                {inCatalog ? (
                    <span
                        className={cn(
                            'flex shrink-0 items-center gap-1.5 text-xs font-medium',
                            statusStyle.text,
                        )}
                        title={STATUS_LABELS[row.status]}
                    >
                        <span className={cn('h-2 w-2 rounded-full', statusStyle.dot)} />
                        {STATUS_LABELS[row.status]}
                    </span>
                ) : (
                    <Pill tone="orange" size="xs">
                        App only
                    </Pill>
                )}
            </CardHeader>

            <CardContent className="flex-1 space-y-3 pb-3">
                <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                    {plugin.description || 'No description yet.'}
                </p>

                <div className="flex flex-wrap gap-1.5">
                    <Pill
                        tone={
                            plugin.implementation === 'wired'
                                ? 'primary'
                                : plugin.implementation === 'in_progress'
                                  ? 'warning'
                                  : 'neutral'
                        }
                        size="xs"
                    >
                        {IMPLEMENTATION_LABELS[plugin.implementation]}
                    </Pill>
                    {typeof row?.connected_tenants === 'number' && (
                        <Pill tone="info" size="xs">
                            {row.connected_tenants} connected
                        </Pill>
                    )}
                    {(row?.error_count_24h ?? 0) > 0 && (
                        <Pill tone="danger" size="xs">
                            {row.error_count_24h} errors / 24h
                        </Pill>
                    )}
                </div>

                {row && row.status !== 'operational' && row.status_message && (
                    <p className="flex gap-2 rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-2">{row.status_message}</span>
                    </p>
                )}

                {inCatalog && (
                    <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
                        <KeyRound className="h-3 w-3" />
                        {row.config_fields.length} field
                        {row.config_fields.length === 1 ? '' : 's'}
                        {requiredCount > 0 && ` · ${requiredCount} required`}
                    </Badge>
                )}
            </CardContent>

            <CardFooter
                className="justify-between border-t pt-3"
                onClick={(e) => e.stopPropagation()}
            >
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Switch
                        checked={!!row?.is_enabled}
                        onCheckedChange={onToggle}
                        disabled={!inCatalog}
                    />
                    <span className="text-muted-foreground">
                        {!inCatalog ? 'Uncontrolled' : row.is_enabled ? 'Offered' : 'Withdrawn'}
                    </span>
                </label>
                <Button variant="outline" size="sm" onClick={onManage}>
                    <Settings2 className="mr-1.5 h-4 w-4" />
                    {inCatalog ? 'Manage' : 'Control'}
                </Button>
            </CardFooter>
        </Card>
    );
}

function ManageDialog({
    integration,
    onClose,
}: {
    integration: IntegrationCatalogEntry | null;
    onClose: () => void;
}) {
    const [updateCatalog, { isLoading: isSaving }] = useUpdateIntegrationCatalogMutation();
    const [updateStatus] = useUpdateIntegrationStatusMutation();

    const [draft, setDraft] = useState<IntegrationCatalogEntry | null>(null);
    // Remount on open so the draft always starts from the row being edited.
    const current = draft?.id === integration?.id ? draft : integration;

    if (!integration || !current) {
        return (
            <Dialog open={false} onOpenChange={onClose}>
                <DialogContent />
            </Dialog>
        );
    }

    const patch = (changes: Partial<IntegrationCatalogEntry>) =>
        setDraft({ ...current, ...changes });

    const patchField = (index: number, changes: Partial<ConfigField>) =>
        patch({
            config_fields: current.config_fields.map((field, i) =>
                i === index ? { ...field, ...changes } : field,
            ),
        });

    const needsMessage = current.status !== 'operational' && !current.status_message?.trim();
    const hasBlankField = current.config_fields.some(
        (f) => !f.key.trim() || !f.label.trim(),
    );

    const handleSave = async () => {
        if (needsMessage) {
            toast.error('Say what is wrong — tenants see this message.');
            return;
        }
        if (hasBlankField) {
            toast.error('Every config field needs a key and a label.');
            return;
        }

        try {
            await updateCatalog({
                id: current.id,
                data: {
                    name: current.name,
                    description: current.description,
                    category: current.category,
                    icon_url: current.icon_url,
                    docs_url: current.docs_url,
                    config_fields: current.config_fields,
                },
            }).unwrap();

            if (
                current.status !== integration.status ||
                current.status_message !== integration.status_message
            ) {
                await updateStatus({
                    id: current.id,
                    status: current.status,
                    status_message: current.status_message ?? undefined,
                }).unwrap();
            }

            toast.success(`${current.name} updated`);
            setDraft(null);
            onClose();
        } catch {
            toast.error('Could not save changes');
        }
    };

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) {
                    setDraft(null);
                    onClose();
                }
            }}
        >
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{integration.name}</DialogTitle>
                    <DialogDescription>
                        <code>{integration.provider}</code> — changes here apply to every tenant.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <section className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="ic-name">Name</Label>
                                <Input
                                    id="ic-name"
                                    value={current.name}
                                    onChange={(e) => patch({ name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ic-category">Category</Label>
                                <Select
                                    value={current.category}
                                    onValueChange={(value) =>
                                        patch({ category: value as IntegrationCatalogEntry['category'] })
                                    }
                                >
                                    <SelectTrigger id="ic-category">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INTEGRATION_CATEGORIES.map((value) => (
                                            <SelectItem key={value} value={value}>
                                                {CATEGORY_LABELS[value]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="ic-description">Description</Label>
                            <Textarea
                                id="ic-description"
                                rows={2}
                                value={current.description ?? ''}
                                onChange={(e) => patch({ description: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="ic-icon">Icon URL</Label>
                                <Input
                                    id="ic-icon"
                                    value={current.icon_url ?? ''}
                                    onChange={(e) => patch({ icon_url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ic-docs">Docs URL</Label>
                                <Input
                                    id="ic-docs"
                                    value={current.docs_url ?? ''}
                                    onChange={(e) => patch({ docs_url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3 rounded-lg border p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="ic-status">Service status</Label>
                                <Select
                                    value={current.status}
                                    onValueChange={(value) =>
                                        patch({
                                            status: value as IntegrationStatus,
                                            ...(value === 'operational' && { status_message: '' }),
                                        })
                                    }
                                >
                                    <SelectTrigger id="ic-status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INTEGRATION_STATUSES.map((value) => (
                                            <SelectItem key={value} value={value}>
                                                {STATUS_LABELS[value]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ic-status-message">
                                    Status message
                                    {current.status !== 'operational' && (
                                        <span className="text-destructive"> *</span>
                                    )}
                                </Label>
                                <Input
                                    id="ic-status-message"
                                    value={current.status_message ?? ''}
                                    onChange={(e) => patch({ status_message: e.target.value })}
                                    disabled={current.status === 'operational'}
                                    placeholder="Shopify API returning 5xx since 14:20 UTC"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Anything other than Operational shows this note to every tenant using{' '}
                            {integration.name}. Clearing back to Operational drops the note.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Required connection info</Label>
                                <p className="text-xs text-muted-foreground">
                                    What a tenant must supply to connect {integration.name}.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    patch({
                                        config_fields: [
                                            ...current.config_fields,
                                            { key: '', label: '', type: 'text', required: true },
                                        ],
                                    })
                                }
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                Add field
                            </Button>
                        </div>

                        {current.config_fields.length === 0 ? (
                            <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                                No fields — this provider connects without tenant-supplied credentials.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {current.config_fields.map((field, index) => (
                                    <div key={index} className="space-y-2 rounded-md border p-3">
                                        <div className="flex gap-2">
                                            <Input
                                                value={field.key}
                                                onChange={(e) => patchField(index, { key: e.target.value })}
                                                placeholder="access_token"
                                                className="font-mono text-xs"
                                            />
                                            <Input
                                                value={field.label}
                                                onChange={(e) => patchField(index, { label: e.target.value })}
                                                placeholder="Access Token"
                                            />
                                            <div className="w-32 shrink-0">
                                                <Select
                                                    value={field.type}
                                                    onValueChange={(value) =>
                                                        patchField(index, {
                                                            type: value as ConfigField['type'],
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CONFIG_FIELD_TYPES.map((value) => (
                                                            <SelectItem key={value} value={value}>
                                                                {value}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    patch({
                                                        config_fields: current.config_fields.filter(
                                                            (_, i) => i !== index,
                                                        ),
                                                    })
                                                }
                                                aria-label={`Remove ${field.label || 'field'}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                value={field.help ?? ''}
                                                onChange={(e) => patchField(index, { help: e.target.value })}
                                                placeholder="Helper text shown under the input"
                                                className="text-xs"
                                            />
                                            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                                                <Switch
                                                    checked={field.required ?? true}
                                                    onCheckedChange={(checked) =>
                                                        patchField(index, { required: checked })
                                                    }
                                                />
                                                Required
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setDraft(null);
                            onClose();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
