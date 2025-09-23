// Utilitaires pour l'application Medicalee

import AsyncStorage from '@react-native-async-storage/async-storage';

// Fonction pour formater les dates
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Fonction pour formater les montants
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Fonction pour obtenir la salutation selon l'heure
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

// Fonction pour formater la dernière connexion
export const getLastConnectionText = (lastConnection?: string): string => {
  if (!lastConnection) return '';
  const lastConn = new Date(lastConnection);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - lastConn.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Connecté récemment';
  if (diffInHours < 24) return `Connecté il y a ${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `Connecté il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
};

// Fonction pour obtenir le statut de validité
export const getValidityStatus = (validity?: string): { text: string; color: string } => {
  if (!validity) return { text: 'Statut inconnu', color: '#4CAF50' };
  
  const validityDate = new Date(validity);
  const now = new Date();
  const diffInDays = Math.floor((validityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 0) {
    return { text: 'Expiré', color: '#F44336' };
  } else if (diffInDays < 30) {
    return { text: `Expire dans ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`, color: '#FF9800' };
  } else {
    return { text: 'Valide', color: '#4CAF50' };
  }
};

// Fonction pour valider un email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Fonction pour valider un matricule
export const isValidMatricule = (matricule: string): boolean => {
  // Logique de validation du matricule selon vos règles métier
  return matricule.length >= 6 && /^[A-Z0-9]+$/.test(matricule);
};

// Fonction pour générer un ID unique
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Fonction pour grouper les éléments par ordre alphabétique
export const groupByAlphabet = <T>(items: T[], getKey: (item: T) => string): { letter: string; data: T[] }[] => {
  const grouped: { [key: string]: T[] } = {};
  
  items.forEach(item => {
    const firstLetter = getKey(item).charAt(0).toUpperCase();
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(item);
  });
  
  return Object.keys(grouped)
    .sort()
    .map(letter => ({
      letter,
      data: grouped[letter].sort((a, b) => getKey(a).localeCompare(getKey(b)))
    }));
};

// Fonction pour sauvegarder des données dans AsyncStorage
export const saveToStorage = async (key: string, value: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to storage:', error);
    throw error;
  }
};

// Fonction pour récupérer des données depuis AsyncStorage
export const getFromStorage = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting from storage:', error);
    return null;
  }
};

// Fonction pour supprimer des données d'AsyncStorage
export const removeFromStorage = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from storage:', error);
    throw error;
  }
};

// Fonction pour nettoyer le cache
export const clearStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};

// Fonction pour débouncer les appels de fonction
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Fonction pour formater les numéros de téléphone
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
  }
  return phone;
};

// Fonction pour masquer les informations sensibles
export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (data.length <= visibleChars) return data;
  const masked = '*'.repeat(data.length - visibleChars);
  return data.slice(0, visibleChars) + masked;
};
