/**
 * Settings Registry
 * Auto-discovers configuration files using Vite's glob import.
 */

export interface PaletteDefinition {
  id: string;
  label: string;
  hsl: string; // HSL color value (e.g., "152 39% 27%")
  isDefault?: boolean;
}

// 1. Define the module type for imported files
interface PaletteModule {
  default?: PaletteDefinition;
  palette?: PaletteDefinition;
  [key: string]: unknown;
}

// 2. Load all palette files from ./palettes directory
// We use eager loading to have them available synchronously at startup
const paletteModules = import.meta.glob<PaletteModule>('./palettes/*.ts', { eager: true });

// 3. Process and register palettes
export const availablePalettes: PaletteDefinition[] = Object.values(paletteModules)
  .map((mod) => mod.default || mod.palette) // Support default export or named 'palette' export
  .filter((p): p is PaletteDefinition => !!p && !!p.id && !!p.hsl); // Type guard to ensure valid palette

// 4. Helper to get the default palette
export const defaultPalette = availablePalettes.find(p => p.isDefault) || availablePalettes[0];

// 5. Helper to validate if a palette ID exists
export const isValidPalette = (id: string): boolean => {
  return availablePalettes.some(p => p.id === id);
};
