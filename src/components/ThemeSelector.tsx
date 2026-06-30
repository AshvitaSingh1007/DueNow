import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';

export const ThemeSelector: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();

  const options: { mode: ThemeMode; icon: React.ComponentType<any>; label: string }[] = [
    { mode: 'light', icon: Sun, label: 'Light' },
    { mode: 'system', icon: Laptop, label: 'Auto' },
    { mode: 'dark', icon: Moon, label: 'Dark' },
  ];

  return (
    <div className="relative flex items-center bg-ink-faint p-1 rounded-full border border-ink-faint backdrop-blur-md shadow-inner select-none transition-all duration-300">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = themeMode === option.mode;

        return (
          <button
            key={option.mode}
            onClick={() => setThemeMode(option.mode)}
            className={`relative p-2 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 z-10 ${
              isActive 
                ? 'text-ink' 
                : 'text-ink-muted hover:text-ink'
            }`}
            title={`${option.label} Theme`}
          >
            {isActive && (
              <motion.div
                layoutId="activeThemeBg"
                className="absolute inset-0 bg-bg shadow-sm border border-ink-faint rounded-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <Icon className="w-4 h-4 relative z-10" />
          </button>
        );
      })}
    </div>
  );
};
