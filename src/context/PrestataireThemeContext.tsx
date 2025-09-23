import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrestataireTheme } from '../types';

interface PrestataireThemeContextType {
  theme: PrestataireTheme;
  toggleTheme: () => void;
  setTheme: (theme: PrestataireTheme) => void;
  isDark: boolean;
}

const lightPrestataireTheme: PrestataireTheme = {
  isDark: false,
  colors: {
    primary: '#3d8f9d', // Même teal que le portail Assuré
    secondary: '#1976D2',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    textPrimary: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#3d8f9d', // Même teal pour le succès
    warning: '#F57C00',
    primaryLight: '#D1FAE5', // Teal très clair comme dans le portail Assuré
    textOnPrimary: '#FFFFFF',
  },
};

const darkPrestataireTheme: PrestataireTheme = {
  isDark: true,
  colors: {
    primary: '#3d8f9d', // Même teal que le portail Assuré
    secondary: '#2196F3',
    background: '#121212',
    surface: '#1E1E1E',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
    error: '#F44336',
    success: '#3d8f9d', // Même teal pour le succès
    warning: '#FF9800',
    primaryLight: '#064E3B', // Teal très foncé comme dans le portail Assuré
    textOnPrimary: '#FFFFFF',
  },
};

const PrestataireThemeContext = createContext<PrestataireThemeContextType | undefined>(undefined);

export const usePrestataireTheme = () => {
  const context = useContext(PrestataireThemeContext);
  if (!context) {
    throw new Error('usePrestataireTheme must be used within a PrestataireThemeProvider');
  }
  return context;
};

interface PrestataireThemeProviderProps {
  children: ReactNode;
}

export const PrestataireThemeProvider: React.FC<PrestataireThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<PrestataireTheme>(lightPrestataireTheme);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('prestataire_theme');
      if (storedTheme) {
        const parsedTheme = JSON.parse(storedTheme);
        setThemeState(parsedTheme);
      }
    } catch (error) {
      console.error('Error loading prestataire theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme.isDark ? lightPrestataireTheme : darkPrestataireTheme;
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('prestataire_theme', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Error saving prestataire theme:', error);
    }
  };

  const setTheme = async (newTheme: PrestataireTheme) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('prestataire_theme', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Error saving prestataire theme:', error);
    }
  };

  const value: PrestataireThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme.isDark,
  };

  return (
    <PrestataireThemeContext.Provider value={value}>
      {children}
    </PrestataireThemeContext.Provider>
  );
};
