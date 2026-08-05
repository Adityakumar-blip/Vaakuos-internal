import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { defaultPalette, isValidPalette, availablePalettes } from '@/config/settings-registry';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { useGetPreferencesQuery, useUpdatePreferencesMutation } from '@/store/api/authApi';

export type Theme = 'light' | 'dark';
// Derive Palette type from the registry's available palettes
export type Palette = string;
export type Direction = 'ltr' | 'rtl';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  palette: Palette;
  setPalette: (palette: Palette) => void;
  direction: Direction;
  setDirection: (direction: Direction) => void;
  toggleDirection: () => void;
  showHelpGuide: boolean;
  setShowHelpGuide: (show: boolean) => void;
  isSyncing: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  theme: 'admin-theme',
  palette: 'admin-palette',
  direction: 'admin-direction',
  showHelpGuide: 'admin-show-help-guide',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.theme) as Theme;
      if (stored) return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [palette, setPaletteState] = useState<Palette>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.palette);
      if (stored && isValidPalette(stored)) return stored;
      return defaultPalette.id;
    }
    return defaultPalette.id;
  });

  const [direction, setDirectionState] = useState<Direction>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEYS.direction) as Direction) || 'ltr';
    }
    return 'ltr';
  });

  const [showHelpGuide, setShowHelpGuideState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.showHelpGuide);
      if (stored !== null) return stored === 'true';
    }
    return true; // Default to showing the guide
  });

  // API Integration
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { data: preferences, isSuccess: isPrefsLoaded } = useGetPreferencesQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [updatePreferences, { isLoading: isSyncing }] = useUpdatePreferencesMutation();

  // Track if initial sync from the API has been completed
  const isInitialized = React.useRef(false);

  // Sync state with preferences from API when they load for the first time
  useEffect(() => {
    if (isPrefsLoaded && preferences && !isInitialized.current) {
      if (preferences.theme) setThemeState(preferences.theme);
      if (preferences.palette && isValidPalette(preferences.palette)) setPaletteState(preferences.palette);
      if (preferences.direction) setDirectionState(preferences.direction);
      if (preferences.showHelpGuide !== undefined) setShowHelpGuideState(preferences.showHelpGuide);
      isInitialized.current = true;
    }
  }, [isPrefsLoaded, preferences]);

  // Reset initialization when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      isInitialized.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-palette', palette);
    localStorage.setItem(STORAGE_KEYS.palette, palette);

    const currentPalette = availablePalettes.find(p => p.id === palette);
    if (currentPalette) {
      root.style.setProperty('--brand-primary', currentPalette.hsl);

      // Extract HSL values to calculate hover state (reduce lightness by 5%)
      const [h, s, l] = currentPalette.hsl.split(' ');
      if (h && s && l) {
        const lightness = parseInt(l.replace('%', ''));
        const hoverLightness = Math.max(0, lightness - 5);
        root.style.setProperty('--primary-hover', `${h} ${s} ${hoverLightness}%`);
      }
    }
  }, [palette]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('dir', direction);
    localStorage.setItem(STORAGE_KEYS.direction, direction);
  }, [direction]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.showHelpGuide, showHelpGuide.toString());
  }, [showHelpGuide]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    if (isAuthenticated) {
      updatePreferences({ theme: newTheme });
    }
  }, [isAuthenticated, updatePreferences]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  const setPalette = useCallback((newPalette: Palette) => {
    if (isValidPalette(newPalette)) {
      setPaletteState(newPalette);
      if (isAuthenticated) {
        updatePreferences({ palette: newPalette });
      }
    }
  }, [isAuthenticated, updatePreferences]);

  const setDirection = useCallback((newDirection: Direction) => {
    setDirectionState(newDirection);
    if (isAuthenticated) {
      updatePreferences({ direction: newDirection });
    }
  }, [isAuthenticated, updatePreferences]);

  const toggleDirection = useCallback(() => {
    const newDirection = direction === 'ltr' ? 'rtl' : 'ltr';
    setDirection(newDirection);
  }, [direction, setDirection]);

  const setShowHelpGuide = useCallback((show: boolean) => {
    setShowHelpGuideState(show);
    if (isAuthenticated) {
      updatePreferences({ showHelpGuide: show });
    }
  }, [isAuthenticated, updatePreferences]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        palette,
        setPalette,
        direction,
        setDirection,
        toggleDirection,
        showHelpGuide,
        setShowHelpGuide,
        isSyncing,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
