import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';

interface UseSearchOptions {
    initialValue?: string;
    debounceDelay?: number;
    onSearchChange?: (value: string) => void;
}

interface UseSearchResult {
    search: string;
    debouncedSearch: string;
    handleSearchChange: (value: string) => void;
    setSearch: (value: string) => void;
}

/**
 * Custom hook to manage search state with debounce.
 */
export function useSearch({
    initialValue = '',
    debounceDelay = 500,
    onSearchChange,
}: UseSearchOptions = {}): UseSearchResult {
    const [search, setSearch] = useState(initialValue);
    const debouncedSearch = useDebounce(search, debounceDelay);

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        if (onSearchChange) {
            onSearchChange(value);
        }
    }, [onSearchChange]);

    return {
        search,
        debouncedSearch,
        handleSearchChange,
        setSearch,
    };
}
