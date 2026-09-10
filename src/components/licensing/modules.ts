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

/**
 * `unset` is not the same as granted, even though the backend lets it through.
 *
 * Failing open is right for enforcement — it stops a new gate locking out plans
 * that predate it. But a console that draws "nobody decided" the same as
 * "deliberately granted" hides the one thing the operator needs to act on, and
 * makes a free plan look identical to the top tier.
 */
export type SlotState = 'granted' | 'locked' | 'unset';

export interface ModuleSlot {
    key: string;
    label: string;
    state: SlotState;
    /** True where the tenant can use it today, however that came about. */
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
 * Resolves a features map into per-module state, keeping `unset` distinct from
 * `granted` so the console can show which plans still need their modules
 * chosen. Access still matches the backend: unset behaves as granted.
 */
export function resolveSlots(
    slots: ModuleDef[],
    features?: Record<string, unknown> | null,
    overrides?: Record<string, unknown> | null,
): ModuleSlot[] {
    return slots.map((s) => {
        const base = features?.[s.code];
        const override = overrides?.[s.code];
        const effective = override !== undefined ? override : base;

        const state: SlotState =
            effective === undefined ? 'unset' : effective === true ? 'granted' : 'locked';

        return {
            key: s.key,
            label: s.label,
            state,
            granted: state !== 'locked',
            overridden: override !== undefined && override !== base,
        };
    });
}

/** True when a licence has not had its modules decided at all. */
export const modulesUnset = (slots: ModuleSlot[]) =>
    slots.length > 0 && slots.every((s) => s.state === 'unset');
