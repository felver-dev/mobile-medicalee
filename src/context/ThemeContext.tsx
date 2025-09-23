import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const lightTheme: Theme = {
  isDark: false,
  colors: {
    primary: '#3d8f9d', // Teal principal comme dans votre design
    primaryLight: '#D1FAE5', // Teal très clair pour les backgrounds
    primaryDark: '#047857', // Teal foncé pour les éléments actifs
    secondary: '#F59E0B', // Orange/jaune pour les accents
    background: '#FAFAFA', // Gris très clair pour l'arrière-plan principal
    surface: '#FFFFFF', // Blanc pur pour les cartes
    surfaceSecondary: '#F3F4F6', // Gris clair pour les surfaces secondaires
    textPrimary: '#1F2937', // Gris très foncé pour les titres
    textSecondary: '#6B7280', // Gris moyen pour les sous-textes
    textInverse: '#FFFFFF', // Blanc pour le texte sur fond coloré
    border: '#E5E7EB', // Gris clair pour les bordures
    error: '#EF4444', // Rouge pour les erreurs
    success: '#3d8f9d', // Teal pour les succès
    warning: '#F59E0B', // Orange pour les avertissements
    info: '#3B82F6', // Bleu pour les informations
    // Couleurs supplémentaires
    teal: '#3d8f9d', // Teal principal
    tealLight: '#D1FAE5', // Teal très clair
    tealDark: '#047857', // Teal foncé
    blue: '#3B82F6', // Bleu principal
    blueLight: '#DBEAFE', // Bleu très clair
    orange: '#F59E0B', // Orange principal
    orangeLight: '#FEF3C7', // Orange très clair
    textOnPrimary: '#FFFFFF',
  },
};

const darkTheme: Theme = {
  isDark: true,
  colors: {
    primary: '#3d8f9d', // Même teal pour la cohérence
    primaryLight: '#064E3B', // Teal très foncé pour les backgrounds sombres
    primaryDark: '#065F46', // Teal encore plus foncé
    secondary: '#F59E0B', // Orange/jaune pour les accents
    background: '#111827', // Gris très foncé pour l'arrière-plan principal
    surface: '#1F2937', // Gris foncé pour les cartes
    surfaceSecondary: '#374151', // Gris moyen pour les surfaces secondaires
    textPrimary: '#F9FAFB', // Blanc cassé pour les titres
    textSecondary: '#D1D5DB', // Gris clair pour les sous-textes
    textInverse: '#111827', // Gris très foncé pour le texte sur fond coloré
    border: '#374151', // Gris moyen pour les bordures
    error: '#EF4444', // Rouge pour les erreurs
    success: '#3d8f9d', // Teal pour les succès
    warning: '#F59E0B', // Orange pour les avertissements
    info: '#3B82F6', // Bleu pour les informations
    // Couleurs supplémentaires
    teal: '#3d8f9d', // Teal principal
    tealLight: '#064E3B', // Teal foncé pour le mode sombre
    tealDark: '#065F46', // Teal très foncé
    blue: '#3B82F6', // Bleu principal
    blueLight: '#1E3A8A', // Bleu foncé pour le mode sombre
    orange: '#F59E0B', // Orange principal
    orangeLight: '#92400E', // Orange foncé pour le mode sombre
    textOnPrimary: '#FFFFFF',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(lightTheme);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme) {
        const parsedTheme = JSON.parse(storedTheme);
        setThemeState(parsedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme.isDark ? lightTheme : darkTheme;
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('theme', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('theme', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme.isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
