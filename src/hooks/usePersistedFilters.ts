import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Custom hook for persisting filters with support for large filter sets
 * 
 * Strategy:
 * 1. Store full filter state in localStorage
 * 2. Generate a short hash for the URL
 * 3. Sync between URL and localStorage
 * 4. Persist across page refreshes
 * 
 * @example
 * const { filters, updateFilters, clearFilters } = usePersistedFilters('user-filters', {
 *   status: [],
 *   role: [],
 *   department: [],
 * });
 */

export interface FilterState {
  [key: string]: string | number | boolean | string[] | number[] | { from?: Date; to?: Date } | null | undefined;
}

interface UsePersistedFiltersOptions<T extends FilterState = FilterState> {
  /** Storage key for localStorage */
  storageKey: string;
  /** Default filter values */
  defaultFilters: T;
  /** Whether to use URL hash for sharing (default: true) */
  useUrlHash?: boolean;
  /** Whether to compress large filter sets (default: true) */
  compress?: boolean;
}

export function usePersistedFilters<T extends FilterState = FilterState>({
  storageKey,
  defaultFilters,
  useUrlHash = true,
  compress = true,
}: UsePersistedFiltersOptions<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<T>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);

  // Generate a simple hash from filter state
  const generateHash = useCallback((filterState: T): string => {
    const str = JSON.stringify(filterState);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }, []);

  // Save filters to localStorage
  const saveToStorage = useCallback((filterState: T) => {
    try {
      const data = {
        filters: filterState,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save filters to localStorage:', error);
    }
  }, [storageKey]);

  // Load filters from localStorage
  const loadFromStorage = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      return data.filters as T;
    } catch (error) {
      console.error('Failed to load filters from localStorage:', error);
      return null;
    }
  }, [storageKey]);

  // Initialize filters on mount
  useEffect(() => {
    const urlHash = searchParams.get('f');
    
    if (urlHash) {
      // Try to load from localStorage using hash
      const stored = loadFromStorage();
      if (stored && generateHash(stored) === urlHash) {
        setFilters(stored);
      } else {
        // Hash mismatch or no stored data, use defaults
        setFilters(defaultFilters);
      }
    } else {
      // No hash in URL, try to load from localStorage
      const stored = loadFromStorage();
      if (stored) {
        setFilters(stored);
        // Update URL with hash if enabled
        if (useUrlHash) {
          const hash = generateHash(stored);
          setSearchParams({ f: hash }, { replace: true });
        }
      } else {
        setFilters(defaultFilters);
      }
    }
    
    setIsLoading(false);
  }, []); // Only run on mount

  // Update filters
  const updateFilters = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setFilters(prev => {
      const newFilters = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates } as T;
      
      // Save to localStorage
      saveToStorage(newFilters);
      
      // Update URL hash if enabled
      if (useUrlHash) {
        const hash = generateHash(newFilters);
        setSearchParams({ f: hash }, { replace: true });
      }
      
      return newFilters;
    });
  }, [saveToStorage, generateHash, useUrlHash, setSearchParams]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    saveToStorage(defaultFilters);
    
    // Remove hash from URL
    if (useUrlHash) {
      setSearchParams({}, { replace: true });
    }
  }, [defaultFilters, saveToStorage, useUrlHash, setSearchParams]);

  // Check if filters are active (different from defaults)
  const hasActiveFilters = useCallback(() => {
    return JSON.stringify(filters) !== JSON.stringify(defaultFilters);
  }, [filters, defaultFilters]);

  // Get filter count (number of active filter fields)
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (Array.isArray(value) && value.length > 0) {
        count++;
      } else if (value && value !== defaultFilters[key]) {
        count++;
      }
    });
    return count;
  }, [filters, defaultFilters]);

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
    activeFilterCount: getActiveFilterCount(),
    isLoading,
  };
}

/**
 * Alternative: Use compressed JSON in URL for sharing
 * This is useful when you need to share exact filter state via URL
 */
export function useCompressedUrlFilters({
  storageKey,
  defaultFilters,
}: Omit<UsePersistedFiltersOptions, 'useUrlHash' | 'compress'>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Compress filter state to base64
  const compressFilters = useCallback((filterState: FilterState): string => {
    try {
      const json = JSON.stringify(filterState);
      return btoa(encodeURIComponent(json));
    } catch (error) {
      console.error('Failed to compress filters:', error);
      return '';
    }
  }, []);

  // Decompress filter state from base64
  const decompressFilters = useCallback((compressed: string): FilterState | null => {
    try {
      const json = decodeURIComponent(atob(compressed));
      return JSON.parse(json);
    } catch (error) {
      console.error('Failed to decompress filters:', error);
      return null;
    }
  }, []);

  // Initialize filters
  useEffect(() => {
    const compressed = searchParams.get('filters');
    
    if (compressed) {
      const decompressed = decompressFilters(compressed);
      if (decompressed) {
        setFilters(decompressed);
        // Also save to localStorage
        localStorage.setItem(storageKey, JSON.stringify(decompressed));
      }
    } else {
      // Try localStorage
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setFilters(parsed);
        } catch (error) {
          setFilters(defaultFilters);
        }
      }
    }
  }, []);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      
      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(newFilters));
      
      // Update URL (only if not too large)
      const compressed = compressFilters(newFilters);
      if (compressed.length < 1500) { // Keep URL reasonable
        setSearchParams({ filters: compressed }, { replace: true });
      } else {
        // Too large, just use localStorage
        setSearchParams({}, { replace: true });
      }
      
      return newFilters;
    });
  }, [compressFilters, setSearchParams, storageKey]);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    localStorage.removeItem(storageKey);
    setSearchParams({}, { replace: true });
  }, [defaultFilters, storageKey, setSearchParams]);

  return {
    filters,
    updateFilters,
    clearFilters,
  };
}
