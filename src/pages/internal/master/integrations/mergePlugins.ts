import { PLATFORM_PLUGIN_BY_PROVIDER, PLATFORM_PLUGINS } from './platformPlugins';
import type { IntegrationCatalogEntry, ManagedPlugin } from './types';

/**
 * Catalog rows plus VaakuOS plugins that still only exist in the tenant app.
 * Control (offer / status / incidents) requires a catalog row.
 */
export function mergePlugins(catalog: IntegrationCatalogEntry[]): ManagedPlugin[] {
  const byProvider = new Map(catalog.map((row) => [row.provider, row]));
  const seen = new Set<string>();
  const merged: ManagedPlugin[] = [];

  for (const declared of PLATFORM_PLUGINS) {
    seen.add(declared.provider);
    const row = byProvider.get(declared.provider) ?? null;
    merged.push({
      provider: declared.provider,
      name: row?.name || declared.name,
      description: row?.description || declared.description,
      category: row?.category || declared.category,
      implementation: declared.implementation,
      catalog: row,
    });
  }

  for (const row of catalog) {
    if (seen.has(row.provider)) continue;
    const declared = PLATFORM_PLUGIN_BY_PROVIDER[row.provider];
    merged.push({
      provider: row.provider,
      name: row.name,
      description: row.description || declared?.description || '',
      category: row.category,
      implementation: declared?.implementation ?? 'wired',
      catalog: row,
    });
  }

  return merged.sort((a, b) => a.name.localeCompare(b.name));
}
