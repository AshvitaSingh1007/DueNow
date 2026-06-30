import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences, updatePreferences } = useAuth();
  
  // Try to load initial theme mode from localStorage, falling back to database preference or system
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const local = localStorage.getItem('duenow_theme_mode') as ThemeMode;
    if (local === 'light' || local === 'dark' || local === 'system') {
      return local;
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Sync with AuthContext preferences when loaded
  useEffect(() => {
    if (preferences?.theme) {
      const dbTheme = preferences.theme as ThemeMode;
      if (dbTheme === 'light' || dbTheme === 'dark' || dbTheme === 'system') {
        setThemeModeState(dbTheme);
        localStorage.setItem('duenow_theme_mode', dbTheme);
      }
    }
  }, [preferences]);

  // Handle setting new theme mode
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('duenow_theme_mode', mode);
    
    // Write theme change back to Firestore via updatePreferences
    try {
      // Map 'system' to standard 'dark' or 'light' for database validation constraint if needed, 
      // or save as is if database rules allow. Since firebase preferences only allows 'light' | 'dark' in security rules:
      // function isValidPreferences() { ... data.theme in ['light', 'dark'] ... }
      // We store 'light' or 'dark' in DB depending on active resolved state, to satisfy security rules,
      // and keep 'system' locally in localStorage. This is a robust integration.
      const dbTheme = mode === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : mode;
        
      await updatePreferences({
        theme: dbTheme as 'light' | 'dark'
      });
    } catch (e) {
      console.warn('Could not sync theme preference with backend:', e);
    }
  };

  // Listen to theme mode changes and system theme changes
  useEffect(() => {
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (themeMode === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Initial resolution
    if (themeMode === 'system') {
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      setResolvedTheme(themeMode);
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [themeMode]);

  // Apply resolvedTheme to HTML element or body for tailwind global support
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    
    // Update theme-color meta tag for fluid experience
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#090d16' : '#FAF9F6');
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
