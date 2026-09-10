import { useMemo } from 'react';
import { useGetMastersQuery } from '@/store/api/mastersApi';

const FEATURES_DROPDOWN_URL = '/plan-features/features-dropdown';

export const MODULE_PREFIX = 'module.';

interface CatalogRow {
    code: string;
    name: string;
    module_key?: string | null;
}

export interface ModuleDef {
    key: string;
    code: string;
    label: string;
}

export interface ModuleSlot {
    key: string;
    label: string;
    granted: boolean;
    /** Granted by a per-tenant override rather than by the plan itself. */
    overridden?: boolean;
}

const NO_SLOTS: ModuleDef[] = [];

const titleCase = (key: string) =>
    key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Every module the catalogue knows about, in one stable order.
 *
 * The order is fixed across every strip on a page — that is the whole point.
 * Two licences compare by eye because slot three is the same module in both, so
 * a gap reads as a difference rather than as different content.
 */
export function useModuleSlots(): ModuleDef[] {
    const { data } = useGetMastersQuery({ url: FEATURES_DROPDOWN_URL });

    return useMemo(() => {
        const rows = (Array.isArray(data) ? data : (data as { data?: CatalogRow[] })?.data) ?? [];
        const gates = rows.filter((r) => r.code.startsWith(MODULE_PREFIX) && r.module_key);
        if (gates.length === 0) return NO_SLOTS;
        return gates
            .map((r) => ({
                key: r.module_key as string,
                code: r.code,
                label: r.name.replace(/ module$/i, '') || titleCase(r.module_key as string),
            }))
            .sort((a, b) => a.key.localeCompare(b.key));
    }, [data]);
}

/**
 * Reads a features map the way the backend does: a module key that is absent
 * means granted, because evaluateFeature() fails open on unknown codes. Only an
 * explicit `false` locks a module.
 */
export function resolveSlots(
    slots: ModuleDef[],
    features?: Record<string, unknown> | null,
    overrides?: Record<string, unknown> | null,
): ModuleSlot[] {
    return slots.map((s) => {
        const base = features?.[s.code];
        const override = overrides?.[s.code];
        const granted = override !== undefined ? override === true : base !== false;
        return {
            key: s.key,
            label: s.label,
            granted,
            overridden: override !== undefined && override !== base,
        };
    });
}
